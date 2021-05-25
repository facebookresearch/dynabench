import { Card, Pagination, Row, Col } from "react-bootstrap";
import React, { Fragment } from "react";
import { useState, useRef } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";

const modelDummyData = [
  {
    model_id: 108,
    bleu: 77.08946295985358,
    model_name: "DeBERTa default params",
    perf_by_tag: [
      {
        tag: "ru_RU-en_XX",
        pretty_perf: "80.5927448867656 %",
        perf: 80.5927448867656,
        perf_dict: { bleu: 80.5927448867656 },
      },
      {
        tag: "en_XX-ru_RU",
        pretty_perf: "48.892302243490086 %",
        perf: 48.892302243490086,
        perf_dict: { bleu: 48.892302243490086 },
      },
    ],
  },
  {
    model_id: 255,
    bleu: 72.08946295985358,
    model_name: "M23_dFG",
    perf_by_tag: [
      {
        tag: "ru_RU-en_XX",
        pretty_perf: "80.5927448867656 %",
        perf: 80.5927448867656,
        perf_dict: { bleu: 80.5927448867656 },
      },
      {
        tag: "en_XX-ru_RU",
        pretty_perf: "48.892302243490086 %",
        perf: 48.892302243490086,
        perf_dict: { bleu: 48.892302243490086 },
      },
    ],
  },
  {
    model_id: 256,
    bleu: 71.08946295985358,
    model_name: "M24",
    perf_by_tag: [
      {
        tag: "ru_RU-en_XX",
        pretty_perf: "80.5927448867656 %",
        perf: 80.5927448867656,
        perf_dict: { bleu: 80.5927448867656 },
      },
      {
        tag: "en_XX-ru_RU",
        pretty_perf: "48.892302243490086 %",
        perf: 48.892302243490086,
        perf_dict: { bleu: 48.892302243490086 },
      },
    ],
  },
  {
    model_id: 258,
    bleu: 72.08946295985358,
    model_name: "M23_sfs",
    perf_by_tag: [
      {
        tag: "ru_RU-en_XX",
        pretty_perf: "80.5927448867656 %",
        perf: 80.5927448867656,
        perf_dict: { bleu: 80.5927448867656 },
      },
      {
        tag: "en_XX-ru_RU",
        pretty_perf: "48.892302243490086 %",
        perf: 48.892302243490086,
        perf_dict: { bleu: 48.892302243490086 },
      },
    ],
  },
  {
    model_id: 259,
    bleu: 41.08946295985358,
    model_name: "M_df4",
    perf_by_tag: [
      {
        tag: "ru_RU-en_XX",
        pretty_perf: "80.5927448867656 %",
        perf: 80.5927448867656,
        perf_dict: { bleu: 80.5927448867656 },
      },
      {
        tag: "en_XX-ru_RU",
        pretty_perf: "48.892302243490086 %",
        perf: 48.892302243490086,
        perf_dict: { bleu: 48.892302243490086 },
      },
    ],
  },
];

const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};

/**
 * Container to show and toggle current sort by.
 *
 * @param {String} props.sortKey the sortBy key for this instance
 * @param {(String)=>void} props.toggleSort function to change the sortBy field.
 * @param {currentSort} props.currentSort the current sortBy field.
 */
const SortContainer = ({
  sortKey,
  toggleSort,
  currentSort,
  className,
  children,
}) => {
  return (
    <div onClick={() => toggleSort(sortKey)} className={className}>
      {currentSort.field === sortKey && currentSort.direction === "asc" && (
        <i className="fas fa-sort-up">&nbsp;</i>
      )}
      {currentSort.field === sortKey && currentSort.direction === "desc" && (
        <i className="fas fa-sort-down">&nbsp;</i>
      )}

      {children}
    </div>
  );
};

/**
 * The Overall Model Leader board component
 *
 * @param {Array} props.models the models to show
 * @param {Object} props.task the task for the leader board.
 */
const ModelLeaderBoard = ({ models, task, taskTitle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState({
    field: "bleu",
    direction: SortDirection.DESC,
  });

  /**
   * Update or toggle the sort field.
   *
   * @param {string} field
   */
  const toggleSort = (field) => {
    const currentDirection = sort.direction;

    const newDirection =
      field !== sort.field
        ? SortDirection.DESC
        : SortDirection.getOppositeDirection(currentDirection);

    setSort({
      field: field,
      direction: newDirection,
    });
  };

  const isEndOfPage = (page + 1) * pageLimit >= total;

  const leadderBoardData = modelDummyData.map((i, index) => {
    return (
      <Fragment key={i.model_id}>
        <tr>
          <td>
            <Link to={`/flores-models/${i.model_id}`} className="btn-link">
              {i.model_name}
            </Link>
          </td>
          <td className="text-right">{i.bleu.toFixed(2)}</td>
        </tr>
      </Fragment>
    );
  });

  return (
    <Row>
      <Col className="ml-auto mr-auto" md="6">
        <Card className="my-4">
          <Card.Header className="light-gray-bg">
            <h2 className="text-uppercase m-0 text-reset">
              Model Leaderboard - {taskTitle}
            </h2>
          </Card.Header>
          <Card.Body className="p-0 leaderboard-container">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="text-right">
                    <SortContainer
                      sortKey={"bleu"}
                      toggleSort={toggleSort}
                      currentSort={sort}
                    >
                      Average BLEU
                    </SortContainer>
                  </th>
                </tr>
              </thead>
              <tbody>{leadderBoardData}</tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={isLoading || page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isLoading || isEndOfPage}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
              </Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
};

export default ModelLeaderBoard;
