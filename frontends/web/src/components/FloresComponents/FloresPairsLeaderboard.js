import React, { useState, useEffect, useContext, useMemo } from "react";
import { Card, Col, Spinner, Table } from "react-bootstrap";
import { useTable, useFilters, useSortBy } from "react-table";
import { Link } from "react-router-dom";
import UserContext from "../../containers/UserContext";
import FloresLanguages from "./FloresLanguages";
import "./FloresGrid.css";

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

const DefaultColumnFilter = ({
  column: { filterValue, preFilteredRows, setFilter },
}) => {
  return (
    <input
      className="table-input"
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Search...`}
    />
  );
};

const LangPairsTable = ({ data, pageLimit }) => {
  const columns = useMemo(
    () => [
      {
        Header: "Source Language",
        accessor: "source_lang",
        disableSortBy: true,
      },
      {
        Header: "Target Language",
        accessor: "target_lang",
        disableSortBy: true,
      },
      {
        Header: "Model",
        id: "model",
        disableSortBy: true,
        disableFilters: true,
        accessor: (data) => (
          <Link to={`/models/${data.model.id}`} className="btn-link">
            {data.model.name}
          </Link>
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
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
    useSortBy
  );

  const firstPageRows = rows.slice(0, pageLimit);

  return (
    <Table hover {...getTableProps()}>
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
                </span>

                <div>
                  {!column.disableFilters ? column.render("Filter") : null}
                </div>
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
                    {...cell.getCellProps()}
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

    //const [modelsData] = preList(simplifiedData[0] && simplifiedData[0].model, simplifiedData[0] && simplifiedData[0].perf_by_tag);
    const [modelsData] = simplifiedData
      .map((o) => preList(o.model, o.perf_by_tag))
      .flat(); // Flat array containing results from all models.

    setTableData(modelsData);
    setIsLoading(false);

    return () => {};
  }, [allModelsData]);

  if (isLoading) return <Spinner animation="border" />;

  return (
    <Col className="ml-auto mr-auto" md={"8"}>
      <Card className="my-4">
        <Card.Header className="light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Language-Pair Leaderboard Top 10
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
