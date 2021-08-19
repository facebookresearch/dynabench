import React from "react";

/**
 * Container to show and toggle current sort by.
 *
 * @param {Object} props React props de-structured.
 * @param {String} props.sortKey the sortBy key for this instance
 * @param {(String)=>void} props.toggleSort function to change the sortBy field.
 * @param {Object} props.currentSort the current sortBy field.
 */
export const SortContainer = ({
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

export const SortDirection = {
  ASC: "asc",
  DESC: "desc",
  getOppositeDirection(direction) {
    return direction === this.ASC ? this.DESC : this.ASC;
  },
};
