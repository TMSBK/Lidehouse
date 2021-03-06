import { _ } from 'meteor/underscore';
import { numeral } from 'meteor/numeral:numeral';
import { debugAssert } from '/imports/utils/assert.js';

const accountSigns = {
  1: +1, 2: +1, 3: +1, 9: +1,
  5: -1, 8: -1,
};

export class TableReport {
  constructor(dataSource, chartOfAccounts) {
    this.dataSource = dataSource;
    this.chartOfAccounts = chartOfAccounts;
    this.filters = {};
    this.rows = [];
    this.cols = [];
  }

  headerLinesCount(dim) {
    const otherDim = (dim === 'rows') ? 'cols' : 'rows';
    let max = 0;
    this[otherDim].forEach(line => max = Math.max(max, line.length));
    return max;
  }

  addFilter(filter) {
    _.extend(this.filters, filter);
  }

  // A lineDef is an array of filters. Each elem in the array is a filter that will show its *value* on the title bar
  addLine(dim, lineDef, asFirst = false) {
    if (asFirst) {
      this[dim].unshift(lineDef);
    } else {
      this[dim].push(lineDef);
    }
  }

  // Adding a whole tree of lines, separately or descarting the current set of lines 
  addTree(dim, treeDef, descartes = true, sumFirst = true, asFirst = false) {
    debugAssert(treeDef.values);
    let nodes = treeDef.values.nodes();
    if (!sumFirst) nodes = nodes.reverse();
    const newLineDefs = nodes.map(node => TableReport.nodeToLineDef(treeDef.field, node));
    if (descartes) {
      this.addDescartesProductLines(dim, newLineDefs);
    } else {
      newLineDefs.forEach(lineDef => this.addLine(dim, [lineDef], asFirst));
    }
  }

  static nodeToLineDef(field, node) {
    return {
      field,
      value: `${node.code}: ${node.label || node.name}`,
      values: _.pluck(node.leafs(), 'code'),
      class: 'header-level' + node.level,
      filter() {
        const obj = {};
        obj[this.field] = { $in: this.values };
        return obj;
      },
    };
  }

  createTableHeader() {
    const headerRows = [];
    for (let y = 0; y < this.headerLinesCount('rows'); y++) {
      const headerRow = [];
      for (let x = 0; x < this.headerLinesCount('cols'); x++) {
        const emptyCell = { class: '', value: ' ' };
        headerRow.push(emptyCell);
      }
      for (let x = 0; x < this.cols.length; x++) {
        const col = this.cols[x];
        headerRow.push(col[y]);
      }
      headerRows.push(headerRow);
    }
    return headerRows;
  }

  createTableBody() {
    const bodyRows = [];
    for (let y = 0; y < this.rows.length; y++) {
      const bodyRow = [];
      const row = this.rows[y];
      for (let x = 0; x < this.headerLinesCount('cols'); x++) {
        bodyRow.push(row[x]);
      }
      for (let x = 0; x < this.cols.length; x++) {
        const col = this.cols[x];
        bodyRow.push(this.cell(x, y));
      }
      bodyRows.push(bodyRow);
    }
    return bodyRows;
  }

  cell(x, y) {
    const colDefs = this.cols[x];
    const rowDefs = this.rows[y];
    const lineDefs = colDefs.concat(rowDefs);

    const filter = _.extend({}, this.filters);
    let classes = 'cell';
    lineDefs.forEach((lineDef) => {
      _.extend(filter, lineDef.filter());
      classes += ' ' + lineDef.class;
    });

    let displaySign = 1;  // the displaySign is the main Account's sign
    if (filter.account) {
      const accountGroupCode = filter.account.$in[0].charAt(0);
      displaySign = this.chartOfAccounts.nodeByCode(accountGroupCode).sign;
    }
    // if (accountName === 'Owners') displaySign *= -1; // The owner's perspective is the opposite of the community's
    let amount = 0;
    this.dataSource.find(filter).forEach(e => {
      amount += e.effectiveAmount();
    });

    const totalAmount = displaySign * amount;
    if (totalAmount < 0) classes += ' negative';
//    console.log(`${x}, ${y}: filter:`); console.log(filter);
    return { class: classes, value: numeral(totalAmount).format() };
  }

  addDescartesProductLines(dim, newLineDefs) {
    const result = [];
    const currentLines = this[dim];
    currentLines.forEach(line =>
      newLineDefs.forEach(newLineDef =>
        result.push(line.concat([newLineDef]))
      )
    );
    this[dim] = result;
  }
}
