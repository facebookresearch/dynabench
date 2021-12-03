# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from glob import glob

import numpy as np
import pandas as pd
from torch.utils.data import Dataset
from tqdm import tqdm


class OpenImagesDataset(Dataset):
    """
    Custom pytorch Dataset class for Open Images dataset. Must
    specify a target_class (i.e. instance.target_class = ~)
    Assumptions:
    - Embeddings are saved as parquet partitions in embeddings_dir
    - Open Images v6 image-level metadata is saved in metadata_dir
    """

    def __init__(
        self,
        metadata_dir: str,
        embeddings_dir: str,
        embeddings_include: str = "*.parquet.gzip",
        target_class: str = None,
        split: str = "train",
    ):

        # Save attributes
        self._metadata_dir = metadata_dir
        self._embeddings_dir = embeddings_dir
        self._embeddings_include = embeddings_include
        self._target_class = None

        # Define paths of metadata files
        assert split in ["train", "test"], "Invalid value for split"
        label_path = os.path.join(metadata_dir, "oidv6-class-descriptions.csv")
        data_path = None
        url_path = None

        if split == "train":
            data_path = os.path.join(
                metadata_dir, "oidv6-train-annotations-human-imagelabels.csv"
            )
            url_path = os.path.join(
                metadata_dir, "oidv6-train-images-with-labels-with-rotation.csv"
            )

        elif split == "test":
            data_path = os.path.join(
                metadata_dir, "test-annotations-human-imagelabels.csv"
            )
            url_path = os.path.join(metadata_dir, "test-images-with-rotation.csv")

        # Load metadata
        print("Loading metadata...", end=" ")
        self._label_df = pd.read_csv(label_path)

        self._data_df = pd.read_csv(data_path)
        self._data_df.drop("Source", axis=1, inplace=True)
        self._data_df.set_index("ImageID", inplace=True)

        self._url_df = pd.read_csv(url_path)
        self._url_df = self._url_df[["ImageID", "OriginalURL"]]
        self._url_df.set_index("ImageID", inplace=True)
        print("Done.")

        # Load embeddings
        self._embeddings_df = self._load_embeddings_df()

        # Load labels
        if target_class is not None:
            self.target_class = target_class

    def to_numpy(self):
        """
        Returns embeddings and labels
        Important: does not make a copy of the data in memory
        """
        return self.embeddings, self.labels

    @property
    def target_class(self):
        return self._target_class

    @property
    def urls(self):
        return self._embeddings_df.index.values

    @property
    def labels(self):
        return self._labels_df.Confidence.values

    @property
    def index(self):
        return self._embeddings_df.index.values

    @property
    def embeddings(self):
        return self._embeddings_df.values

    @property
    def embeddings_dimension(self):
        return self._embeddings_df.shape[1]

    @target_class.setter
    def target_class(self, target_class):
        self._labels_df = self._load_labels_df(target_class)
        self._target_class = target_class

    def _load_labels_df(self, label: str):
        """
        Loads metadata in metadata_dir for target_class
        """
        # Get label name
        label_name = self._label_df.query(f'DisplayName == """' + label + '"""')[
            "LabelName"
        ].to_list()[0]

        # Get labeled data given label
        df = self._data_df.query(f"LabelName == '{label_name}'")

        # Join with URL data
        df = df.join(self._url_df, on="ImageID", how="left")

        # Rename columns and reset index
        df.reset_index(inplace=True)
        df.rename(columns={"OriginalURL": "img_path"}, inplace=True)
        df.set_index("img_path", inplace=True)

        # Align label index with embeddings index
        df = df.reindex(self._embeddings_df.index, fill_value=0)

        return df

    def _load_embeddings_df(self):
        """
        Loads embeddings from partitions in embeddings_dir with specified
        pattern. Each embedding value is loaded into a separate column
        such that embeddings.values returns the array necessary for
        inference, which avoids creating a copy in memory of the data
        """
        # Get paths of dfs in embeddings_dir with pattern
        pattern = os.path.join(self._embeddings_dir, self._embeddings_include)
        filepaths_ls = glob(pattern, recursive=True)
        filepaths_ls.sort()

        # Store all embedding values and indices
        index_ls = []
        values_ls = []
        wrapped_loader = tqdm(filepaths_ls, desc="Loading embeddings", unit="partition")
        for filepath in wrapped_loader:

            df = pd.read_parquet(filepath)
            index_ls.append(df.index)
            values_ls.append(df["embedding"].tolist())

        # Join into single df and return
        return pd.DataFrame(
            np.concatenate(values_ls, axis=0, dtype=np.float32),
            index=np.concatenate(index_ls, axis=0),
        )

    """
    Necessary for pytorch
    """

    def __len__(self):
        return len(self._embeddings_df)

    def __getitem__(self, idx: int):
        return (
            self._embeddings_df.iloc[idx].values,
            self._labels_df.Confidence.iloc[idx],
        )
