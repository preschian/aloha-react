var React           = require('react');
var ReactDOM        = require('react-dom');
var FixedDataTable  = require('fixed-data-table');

var Table           = FixedDataTable.Table;
var Column          = FixedDataTable.Column;

// react router
var Router 			= require('react-router').Router;
var Route 			= require('react-router').Route;
var IndexRoute		= require('react-router').IndexRoute;
var Link 			= require('react-router').Link;
var IndexLink 		= require('react-router').IndexLink;
var createHistory	= require('history/lib/createHistory');
var useBasename		= require('history/lib/useBasename');

var SortTypes = {
	ASC: 'ASC',
	DESC: 'DESC',
};

var App = React.createClass({
	render: function() {
		return <div className="container">
			<h1>Aloha React</h1>

			<Link to="/table" className="btn">Table</Link>
			<Link to="/infinite" className="btn">Infinite load</Link>

			{this.props.children}
		</div>;
	}
});

var OpenTable = React.createClass({
	getInitialState: function() {
		return {
			dataTable: [],
			filteredRows: [],
			filterBy: null,
			sortBy: '',
	        sortDir: null
		};
	},
	componentWillMount: function() {
        $.get('assets/user-100.json', function(json) {
			this.setState({
				dataTable: JSON.parse(json).results,
				filteredRows: JSON.parse(json).results
			});
		}.bind(this));
	},
	_renderAllData: function(index) {
		return this.state.filteredRows[index].user;
	},
	_renderName: function(cellData, cellDataKey, rowData) {
		return <span>{rowData.name.first + ' ' + rowData.name.last}</span>;
	},
	_renderLokasi: function(cellData, cellDataKey, rowData) {
		return <span>{rowData.location.street + ' ' + rowData.location.city + ', ' + rowData.location.state}</span>;
	},
	_filterRowsBy: function(filterBy) {
		var dataTable = this.state.dataTable.slice();
		var filteredRows = filterBy ? dataTable.filter(function(row) {
            var namaLengkap = row.user.name.first + ' ' + row.user.name.last;

			return namaLengkap.toLowerCase().indexOf(filterBy.toLowerCase()) >= 0;
		}) : dataTable;

		this.setState({
			filteredRows: filteredRows
		});
    },
	_onFilterChange: function(e) {
		this._filterRowsBy(e.target.value);
    },
	_sortRowsBy: function(cellDataKey) {
		var sortDir = this.state.sortDir;
		var sortBy = cellDataKey;

		if (sortBy === this.state.sortBy) {
			sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
		} else {
			sortDir = SortTypes.DESC;
		}

		var filteredRows = this.state.filteredRows.slice();
		filteredRows.sort( function(a, b) {
			var sortVal = 0;
            if (sortBy === 'name') {
    			if (a.user.name.first > b.user.name.first)
    				sortVal = 1;

    			if (a.user.name.first < b.user.name.first)
    				sortVal = -1;
            } else {
    			if (a.user[sortBy] > b.user[sortBy])
    				sortVal = 1;

    			if (a.user[sortBy] < b.user[sortBy])
    				sortVal = -1;
            }

			if (sortDir === SortTypes.DESC) {
				sortVal = sortVal * -1;
			}

			return sortVal;
		});

		this.setState({
			filteredRows: filteredRows,
			sortBy: sortBy,
			sortDir: sortDir,
		});
    },
	_renderHeader: function(label, cellDataKey) {
		return <a onClick={this._sortRowsBy.bind(null, cellDataKey)}>{label}</a>;
	},
	render: function() {
		var rem          = 16 * 3,
            maxHeight    = 16 * 30,
			autoHeight   = ((this.state.filteredRows.length + 1) * rem),
            sortDirArrow = '';

        if (autoHeight > maxHeight)
            autoHeight = maxHeight;

	    if (this.state.sortDir !== null){
	    	sortDirArrow = this.state.sortDir === SortTypes.DESC ? ' ↑' : ' ↓';
	    }

		return <div className="table">
			<input type="text" onChange={this._onFilterChange} placeholder="Filter berdasarkan nama" />
			<div className="table-container">
				<Table
					rowHeight={rem}
					rowGetter={this._renderAllData}
					rowsCount={this.state.filteredRows.length}
					width={16*60}
					height={autoHeight}
					headerHeight={rem}>
					<Column
						align="center"
						cellRenderer={this._renderName}
						dataKey="name"
						flexGrow={1}
	                    headerRenderer={this._renderHeader}
	                    label={"Nama" + (this.state.sortBy === "name" ? sortDirArrow : '')}
						width={100}
					/>
					<Column
						align="center"
						cellRenderer={this._renderLokasi}
						dataKey="location"
						flexGrow={2}
						label="Lokasi"
						width={200}
					/>
					<Column
						align="center"
						dataKey="email"
						flexGrow={2}
	                    headerRenderer={this._renderHeader}
	                    label={"Email" + (this.state.sortBy === "email" ? sortDirArrow : '')}
						width={200}
					/>
					<Column
						align="center"
						dataKey="gender"
						flexGrow={1}
	                    headerRenderer={this._renderHeader}
						label={"Gender" + (this.state.sortBy === "gender" ? sortDirArrow : '')}
						width={100}
					/>
			    </Table>
			</div>
        </div>;
	}
});

var CardItem = React.createClass({
    render: function() {
        return <div className="card">
			<div className="card-image" style={{backgroundImage: 'url("' + this.props.picture + '")'}}></div>
			<div className="card-info">
				<span>{this.props.fullName}</span>
				<span>{this.props.email}</span>
			</div>
        </div>;
    }
});

var CardLoad = React.createClass({
	render: function() {
		return <div className={"loading " + ((this.props.isLoad) ? "loading-show" : "")}>
			<div className="loading-circle"></div>
		</div>;
	}
});

var CardItems = React.createClass({
    getInitialState: function() {
        return {
            items: [],
			isLoad: false
        };
    },
	componentWillMount: function() {
		this._getMoreItems(0, 9);
	},
	componentDidMount: function() {
		var self = this;

		$(window).scroll(function() {
			if ($(window).scrollTop() + $(window).height() == $(document).height()) {
				$('.loading').on('mousewheel', function(e) {
					e.preventDefault();
					e.stopPropagation();
				});

				var start 	= self.state.items.length,
					end		= start + 9;

				self.setState({
					isLoad: true
				});

				// for load animation delay 1.5 sec
				setTimeout(function() {
					self._getMoreItems(start, end);
				}, 1500);
			}
		});
	},
	_getMoreItems: function(start, end) {
		var source = 'assets/user-100.json';

		$.get(source, function(json) {
			for (var i = start; i < end; i++) {
				this.setState({
					items: this.state.items.concat(JSON.parse(json).results[i].user)
				});
			}
		}.bind(this));

		this.setState({
			isLoad: false
		});
	},
    render: function() {
		var _renderCard = this.state.items.map(function(item) {
			return <CardItem
				key={item.HETU + item.email}
				fullName={item.name.first + ' ' + item.name.last}
				email={item.email}
				picture={item.picture.medium} />;
		});

        return <div className="card-container">
			<br />
			<CardLoad isLoad={this.state.isLoad} />
			{_renderCard}
		</div>;
    }
});

var history = useBasename(createHistory)({
	basename: '/aloha-react/dist'
});

ReactDOM.render(
	<Router history={history}>
		<Route path='/' component={App}>
			<IndexRoute component={OpenTable} />
			<Route path='table' component={OpenTable} />
			<Route path='infinite' component={CardItems} />
		</Route>
	</Router>,
	document.getElementById('app')
);
