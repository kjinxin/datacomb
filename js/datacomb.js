//
//
// Datacomb interface class

//
"use strict";

// NPM deps
var ScrollableTable = require('smart-table-scroll');
var Ractive = require('ractive');
var _ = require('lodash');

// local deps
var dataParser = require('./data-parser');
var Manager = require('./manager');

//
var defaults = { };

//
var Datacomb = function(opts) {
  if(!opts.el) { throw new Error("Need to pass `el` into Datacomb."); }
  if(!opts.data) { throw new Error("Need to pass `data` into Datacomb."); }
  if(!opts.columns) { throw new Error("Need to pass `columns` into Datacomb."); }

  // inherit from options, defaults
  for(var key in defaults) { this[key] = defaults[key]; }
  for(var key in opts) { this[key] = opts[key]; }

  //
  this.parsed = dataParser(this.data, this.columns, this.labelAccessor);

  //
  this.initManager();
  this.initTable();
};
//
//

//
Datacomb.prototype.initManager = function() {
  var self = this;

  // init Ractive element to build dom, handle settings and interaction
  this.manager = new Manager({
    el: this.el,
    data: {
      cols: this.parsed.columns
    }
  });

  this.manager.observe('sortColNdx sortDesc', this.applySort, { init: false });
  this.manager.observe('filters.*', this.applyFilters, { init: false });
  this.manager.on('*.sort-by-col', function(evt, colNdx, descOrder) {
    self.applySort(colNdx, descOrder);
  });

  // var colHeaderEl = this.el.querySelector('.dc-col-headers');
  // colHeaderEl.innerHTML = "<div class='dc-clabel'>Name</div>" +
  //   this.parsed.columns
  //     .map(function(col) { return "<div class='dc-clabel'>"+col.label+"</div>"; })
  //     .join('');
};

//
//

//
Datacomb.prototype.initTable = function() {
  var self = this;

  this.table = new ScrollableTable({
    el: this.el.querySelector('.dc-table'),
    data: this.parsed.rows,
    availableNodes: 250,
    heightFn: function(d) { return 4; },
    buildRow: function(d) {
      var node = document.createElement('div');
      var nodeContent = "<div class='dc-rlabel'><div class='dc-label'>"+d._rowLabel+"</div></div>";
      node.classList.add('dc-row');
      self.parsed.columns.forEach(function(column, colNdx) {
        if(column.type === 'discrete') {
          nodeContent += "<div class='dc-disccell'><div class='dc-disc-val'>"+d._values[colNdx]+"</div></div>";
        } else {
          nodeContent += "<div class='dc-datacell'><div class='dc-bar' style='width:"+d._widths[colNdx]+"%'></div><div class='dc-cont-val'>"+d._labels[colNdx]+"</div></div>";
        }
      });
      node.innerHTML = nodeContent;
      return node;
    },
    updateRow: function(d, el) {
      el.childNodes[0].childNodes[0].textContent = d._rowLabel;
      for(var colNdx = 0; colNdx < self.parsed.columns.length; colNdx++) {
        if(self.parsed.columns[colNdx].type === 'discrete') {
          el.childNodes[colNdx + 1].childNodes[0].textContent = d._values[colNdx];

        } else {
          el.childNodes[colNdx+1].childNodes[0].style.width = ''+d._widths[colNdx]+'%';
          el.childNodes[colNdx + 1].childNodes[1].textContent = d._labels[colNdx];

        }
      }
    }
  });
};

//
Datacomb.prototype.applySort = function(columnNdx, sortDescending) {
  this.parsed.rows = _.sortBy(this.parsed.rows, function(d) { return d._values[columnNdx]; });
  if(sortDescending) { this.parsed.rows.reverse(); }
  this.table.updateData(this.parsed.rows);
};

//
Datacomb.prototype.applyFilters = function(filters) { };

//
module.exports = Datacomb;
