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
  DropdownButton,
  Pagination,
  FormControl,
} from "react-bootstrap";
import {
  useTable,
  useFilters,
  usePagination,
  useSortBy,
  useFlexLayout,
  useBlockLayout,
} from "react-table";
import UserContext from "../../containers/UserContext";
import FloresLanguages from "./FloresLanguages";
import "./FloresPairsLeaderboard.css";

/**
 * Prepare list of results to display table, takes an array of perf_tags as parameters
 *
 * @param {Array} perf_tags The array of performance tags (language-pairs)
 * @returns
 */
const preList = (perf_tags) => {
  const tableData =
    perf_tags &&
    perf_tags.map((s, i) => {
      const source = FloresLanguages.find((o) => o.ISO === s.tag.split("-")[0]);
      const target = FloresLanguages.find((o) => o.ISO === s.tag.split("-")[1]);
      return {
        model: s.top_perf_info,
        source_tag: s.tag.split("-")[0],
        target_tag: s.tag.split("-")[1],
        perf: s.top_perf_info.perf,
        source_lang: source.LANGUAGE,
        target_lang: target.LANGUAGE,
      };
    });
  return tableData;
};

/**
 * Get unique values to populate dropdown language options.
 *
 * @param {Array} data Prefilterd data.
 * @param {String} values Value property in the data.
 * @param {String} propertyName The property name to be filtered (source_lang or target_lang).
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
    <i className="fas fa-list fa-sm ml-1 list-icon"></i>
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

const LangPairsTable = ({ columns, data }) => {
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
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
    usePagination,
    useFlexLayout,
    useBlockLayout
  );

  return (
    <>
      <Card.Body className="p-0 leaderboard-container">
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
            {page.map((row, i) => {
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
      </Card.Body>
      <Card.Footer>
        <span className="page-info">
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <Pagination className="mb-0 float-right" size="sm">
          <Pagination.Item
            disabled={!canPreviousPage}
            onClick={() => previousPage()}
          >
            Previous
          </Pagination.Item>
          <Pagination.Item disabled={!canNextPage} onClick={() => nextPage()}>
            Next
          </Pagination.Item>
        </Pagination>
      </Card.Footer>
    </>
  );
};

const FloresPairsLeaderBoard = ({ taskId, history, ...props }) => {
  const context = useContext(UserContext);
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetIndex, setDatasetIndex] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    context.api
      .getLeaderboardTopPerformingTags(taskId, 10100)
      .then((result) => {
        let output = Object.entries(result).map(([dataset, results]) => ({
          dataset,
          results,
        }));
        setData(output);
        setTableData(preList(output[0].results.data));
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          history.push("/");
        }
      });

    return () => {};
  }, [taskId, context.api, history]);

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
          <a href={`/models/${data.model.model_id}`} className="btn-link">
            {data.model.model_name || null}
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

  const selectDataset = (index) => {
    setDatasetIndex(index);
    setTableData(preList(data[index].results.data));
  };

  const datasetsOptions =
    data &&
    data.map((i, index) => {
      return (
        <Dropdown.Item
          key={index}
          className="dataset-info"
          active={index === datasetIndex ? true : false}
          onClick={() => selectDataset(index)}
        >
          {i.dataset}
        </Dropdown.Item>
      );
    });

  return (
    <Col className="ml-auto mr-auto" md={"7"}>
      <Card className="my-4">
        <Card.Header className="light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Language-Pair Leaderboard
          </h2>
          <DropdownButton
            variant="light"
            size="sm"
            className="float-right"
            title="Dataset"
          >
            {datasetsOptions}
          </DropdownButton>
        </Card.Header>
        {isLoading ? (
          <div className="mx-auto my-3">
            <Spinner animation="border" />{" "}
          </div>
        ) : (
          <LangPairsTable columns={columns} data={tableData} />
        )}
      </Card>
    </Col>
  );
};

export default FloresPairsLeaderBoard;
