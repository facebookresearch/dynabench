# Copyright (c) Facebook, Inc. and its affiliates.

import unittest

from populate_vqa import getImagesFromFile, getImageUrl, getSetName


class TestPopulateVQA(unittest.TestCase):
    def test_getSetName(self):
        self.assertEqual(getSetName("person_keypoints_train2014"), "train2014")
        with self.assertRaises(Exception):
            getSetName("val2014")

    def test_getImagesFromFile(self):
        with self.assertRaises(Exception):
            result = getImagesFromFile("invalidFile")
        result = getImagesFromFile("image_info_test2015")
        self.assertEqual(len(result), 81434)

    def test_getImageUrl(self):
        setName = "train2015"
        id = "000000072023"
        e = "https://s3.us-east-1.amazonaws.com/images.cocodataset.org/{}/{}.jpg"
        e = e.format(setName, id)
        self.assertEqual(e, getImageUrl(setName, id))


if __name__ == "__main__":
    unittest.main()
