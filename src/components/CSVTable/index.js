import React, { Component }  from 'react';

class CSVTable extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (!this.props.value) {
      return <div></div>
    }
    const head = this.props.value.split('\n')[0];
    const body = this.props.value.split('\n').slice(1);
    return (
      <table
        style={{
          border: '1px solid black',
          cellspacing: 0,
          cellpadding: 0,
          borderColor: "#333333",
          margin: 10,
        }}
      >
        <tbody>
        <tr>
        {
          head.split(',').map( (v, i) => {
            return <th key={i}> { v } </th>
          })
        }
        </tr>
        {
          body.map( (line, i) => {
            return (<tr key={i}>
              {
                line.split(',').map( (v, i) => {
                  if (i > 1) {
                    if (v === '') {
                      return ( <td key={i} className="Data"> - </td> )
                    } else {
                      return ( <td key={i} className="Data"> { v } </td> )
                    }
                  } else {
                    return ( <td key={i}> { v } </td> )
                  }
                })
              }
              </tr>
            )
          })
        }
        </tbody>
      </table>
    )
  }
}

export default CSVTable;
