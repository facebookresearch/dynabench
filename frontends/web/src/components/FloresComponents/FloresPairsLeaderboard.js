/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  forwardRef,
} from "react";
import {
  Card,
  Col,
  Spinner,
  Table,
  Dropdown,
  FormControl,
} from "react-bootstrap";
import {
  useTable,
  useFilters,
  useSortBy,
  useFlexLayout,
  useBlockLayout,
} from "react-table";
import UserContext from "../../containers/UserContext";
import FloresLanguages from "./FloresLanguages";
import "./FloresPairsLeaderboard.css";

/**
 * Prepare list of results to display table, takes model and perf_tags as parameters
 *
 * @param {*} model The model object.
 * @param {*} perf_tags The array of performance tags (language-pairs)
 * @returns
 */
const preList = (model, perf_tags) => {
  const modelData =
    perf_tags &&
    perf_tags.map((s, i) => {
      const source = FloresLanguages.find((o) => o.ISO === s.tag.split("-")[0]);
      const target = FloresLanguages.find((o) => o.ISO === s.tag.split("-")[1]);
      const score = Math.round(s.perf * 100) / 100 || null;
      return {
        model: model,
        source_tag: s.tag.split("-")[0],
        target_tag: s.tag.split("-")[1],
        perf: score,
        source_lang: source.LANGUAGE,
        target_lang: target.LANGUAGE,
      };
    });
  return [modelData];
};

/**
 * Get unique values to populate dropdown language options.
 *
 * @param {[]} data Prefilterd data
 * @param {String} values Value property in the data
 * @param {String} propertyName The property name to be filtered (source_lang or target_lang)
 * @returns
 */
const unique = (data, values, propertyName) => {
  return data.filter(
    (e, i) =>
      data.findIndex(
        (a) => a[values][propertyName] === e[values][propertyName]
      ) === i
  );
};

const CustomToggle = forwardRef(({ children, onClick }, ref) => (
  <span
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
    <i className="fas fa-list ml-1"></i>
  </span>
));

const LanguageMenu = forwardRef(
  ({ children, style, "aria-labelledby": labeledBy }, ref) => {
    const [value, setValue] = useState("");
    return (
      <div
        ref={ref}
        style={style}
        className="lang-dropdown"
        aria-labelledby={labeledBy}
      >
        <div className="search-bar">
          <FormControl
            autoFocus
            className="mx-2"
            size="sm"
            placeholder="Select a language"
            onChange={(e) => setValue(e.target.value)}
            value={value || ""}
          />
        </div>
        <ul className="my-4 px-0">
          {React.Children.toArray(children).filter(
            (child) =>
              !value || child.props.children.toLowerCase().startsWith(value)
          )}
        </ul>
      </div>
    );
  }
);

const DefaultColumnFilter = ({
  column: { filterValue, preFilteredRows, setFilter, id },
}) => {
  const [selected, setSelected] = useState(null);
  const handleSelection = (e) => {
    setFilter(e || undefined);
    setSelected(e);
  };

  return (
    <span className="filter-wrapper">
      <Dropdown onSelect={handleSelection}>
        <Dropdown.Toggle
          as={CustomToggle}
          id="dropdown-custom-components"
        ></Dropdown.Toggle>
        <Dropdown.Menu as={LanguageMenu}>
          <Dropdown.Item
            key={"0"}
            eventKey={""}
            active={selected === "* All" ? true : false}
          >
            * All
          </Dropdown.Item>
          {preFilteredRows &&
            unique(preFilteredRows, "values", id).map((i, index) => (
              <Dropdown.Item
                key={i.id}
                eventKey={i.values[id]}
                active={selected === i.values[id] ? true : false}
              >
                {i.values[id]}
              </Dropdown.Item>
            ))}
        </Dropdown.Menu>
      </Dropdown>
    </span>
  );
};

const LangPairsTable = ({ data, pageLimit }) => {
  const columns = useMemo(
    () => [
      {
        Header: "Source Language",
        id: "source_lang",
        accessor: (data) => `${data.source_lang} (${data.source_tag})`,
        disableSortBy: true,
        minWidth: 220,
      },
      {
        Header: "Target Language",
        id: "target_lang",
        accessor: (data) => `${data.target_lang} (${data.target_tag})`,
        disableSortBy: true,
        minWidth: 220,
      },
      {
        Header: "Model",
        id: "model",
        disableSortBy: true,
        disableFilters: true,
        minWidth: 110,
        accessor: (data) => (
          <a href={`/models/${data.model.id}`} className="btn-link">
            {data.model.name}
          </a>
        ),
      },
      {
        Header: "BLEU Score",
        accessor: "perf",
        disableFilters: true,
      },
    ],
    []
  );

  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        defaultColumn,
        initialState: {
          sortBy: [
            {
              id: "perf",
              desc: true,
            },
          ],
        },
      },
      useFilters,
      useSortBy,
      useFlexLayout,
      useBlockLayout
    );

  const firstPageRows = rows.slice(0, pageLimit);

  return (
    <Table hover {...getTableProps()} className="pairs-leaderboard">
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                className={column.canSort ? "text-right" : ""}
                {...column.getHeaderProps()}
              >
                <span
                  onClick={() => {
                    if (!column.disableSortBy) {
                      column.isSortedDesc
                        ? column.toggleSortBy(false, false)
                        : column.toggleSortBy(true, false);
                    }
                  }}
                >
                  {column.isSorted ? (
                    column.isSortedDesc ? (
                      <i className="fas fa-sort-up">&nbsp;</i>
                    ) : (
                      <i className="fas fa-sort-down">&nbsp;</i>
                    )
                  ) : (
                    ""
                  )}{" "}
                  {column.render("Header")}
                </span>{" "}
                {!column.disableFilters ? column.render("Filter") : null}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {firstPageRows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return (
                  <td
                    className={cell.column.canSort ? "text-right" : ""}
                    {...cell.getCellProps({
                      style: {
                        width: cell.column.width,
                        minWidth: cell.column.minWidth,
                      },
                    })}
                  >
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const FloresPairsLeaderBoard = ({ taskId, history, ...props }) => {
  const context = useContext(UserContext);
  const [allModelsData, setAllModelsData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLimit, setPageLimit] = useState(10);

  useEffect(() => {
    setIsLoading(true);

    context.api
      .getDynaboardScores(
        taskId,
        10, // Get info for the best 10 models
        0, // No offset required
        "sp-BLEU",
        "desc",
        [1, 0, 0, 0, 0],
        [1]
      ) // No weights.
      .then((result) => {
        const models = Promise.all(
          result.data.map((i) => context.api.getModel(i.model_id))
        );
        models.then((res) => {
          setAllModelsData(res);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          history.push("/");
        }
      });

    setIsLoading(false);
    return () => {};
  }, [context.api, taskId, history]);

  useEffect(() => {
    setIsLoading(true);
    const simplifiedData = allModelsData.map((i) => ({
      model: { name: i.name, id: i.id },
      perf_by_tag:
        i.leaderboard_scores[0] &&
        JSON.parse(i.leaderboard_scores[0].metadata_json).hasOwnProperty(
          "perf_by_tag"
        )
          ? JSON.parse(i.leaderboard_scores[0].metadata_json)["perf_by_tag"]
          : [],
    }));

    const [modelsData] = simplifiedData
      .map((o) => preList(o.model, o.perf_by_tag))
      .flat(); // Flat array containing results from all models.

    setTableData(modelsData);
    setIsLoading(false);

    return () => {};
  }, [allModelsData]);

  if (isLoading) return <Spinner animation="border" />;

  return (
    <Col className="ml-auto mr-auto" md={"7"}>
      <Card className="my-4">
        <Card.Header className="light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Language-Pair Leaderboard
          </h2>
        </Card.Header>
        <Card.Body className="p-0 leaderboard-container">
          {tableData && (
            <LangPairsTable data={tableData} pageLimit={pageLimit} />
          )}
        </Card.Body>
        <Card.Footer></Card.Footer>
      </Card>
    </Col>
  );
};

export default FloresPairsLeaderBoard;
