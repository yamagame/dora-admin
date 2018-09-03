import React, { Component }  from 'react';
import { connect } from 'react-redux'
import Button from './components/Button';
import Column from './components/Column';
import AceEditor from 'react-ace';
import {
  playSpeech,
  stopSpeech,
  playScenario,
  stopScenario,
  save,
  load,
  list,
  changeLayout,
  setParams,
  loadResult,
} from './reducers'
import './App.css';
import CSVTable from './components/CSVTable';

import 'brace/mode/plain_text';
import './libs/example_mode';
import 'brace/theme/monokai';
import AdminResult from './components/AdminResult';

function buttonValue(v, height, host) {
  if (typeof v !== 'object') {
    return <p> { v } </p>;
  }
  if (v.image) {
    return <div style={{ marginTop: 10, }} ><img alt="icon" style={{ margin: 'auto', padding: 0, pointerEvents: 'none', }} height={height-4} src={(host) ? host+v.image : v.image} /></div>
  }
  return <p> { v.value } </p>;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.text,
      row: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      page: '',
      quizId: null,
      startTime: null,
      playerName: null,
    }
    this.saveTimeout = null;
  }

  onResize = () => {
    this.props.onLayout({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.text !== this.props.text) {
      this.setState({
        value: nextProps.text,
      });
    }
  }

  onChange = (newValue) => {
    this.setState({
      value: newValue,
    });
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.props.save(this.state.value, (err) => {
        this.saveTimeout = null;
      });
    }, 1000);
  }

  onCursorChange = (selection, event) => {
    const srow = selection.getRange().start.row;
    const erow = selection.getRange().end.row;
    this.setState({
      startRow: srow,
      endRow: erow,
      row: selection.getSelectionLead().row,
    });
  }

  debug = () => {
  }

  play = (range) => {
    this.props.setParams({ playing: true });
    this.props.playScenario(this.props.adminFilename, range);
  }

  playAll = () => {
    this.play({});
  }

  playRange = () => {
    if (this.state.startRow == this.state.endRow) {
      this.play({ start: this.state.startRow });
    } else {
      this.play({ start: this.state.startRow, end: this.state.startRow+Math.max(1, this.state.endRow-this.state.startRow) });
    }
  }

  stop = () => {
    this.props.stopScenario();
    this.props.setParams({ playing: false });
  }

  _play = (scenario) => {
    const s = scenario.map( (v,i) => {
      if (v === '' && i > 0) {
        return ':1s';
      }
      return v;
    }).join('\n').replace(/(\/\*[^*]*\*\/)|(\/\/.*)/g, '//').trim()
    this.props.playSpeech(s);
  }

  _playAll = () => {
    this.play(this.state.value.split('\n'));
  }

  _playRange = () => {
    if (this.state.startRow == this.state.endRow) {
      this.play(this.state.value.trim().split('\n').slice(this.state.startRow));
    } else {
      this.play(this.state.value.trim().split('\n').slice(this.state.startRow, this.state.startRow+Math.max(1, this.state.endRow-this.state.startRow)));
    }
  }

  _stop = () => {
    this.props.stopSpeech();
  }

  rename = () => {
    this.setState({
      changeName: true,
    }, () => {
      this.entryName.value = this.props.name;
    });
  }

  startQuiz = () => {
    if (this.entryName.value.trim() !== '') {
      this.props.setParams({ name: this.entryName.value.trim(), adminFilename: '出席表示' }, () => {
        this.setState({
          changeName: false,
        }, () => {
          this.props.list(() => {
            this.props.load({ filename: '出席CSV' });
          });
        });
      });
    }
  }

  render() {
    if (typeof this.props.name === 'undefined' || this.props.name === '' || this.props.name.length <= 1 || this.state.changeName) {
      return this.renderTitle({});
    }
    return this.renderEditor({})
  }

  renderEditor() {
    return (
      <div>
        <select value={this.props.adminFilename} onChange={(event) => {
          const value = event.target.value;
          if (value === '集計表示') {
            this.props.setParams({ adminFilename: value, adminPage: '集計', }, () => {
              this.props.loadResult(this.props.adminQuizId, this.props.adminStartTime, this.props.adminPlayerName, () => {
              });
            });
          } else
          if (value === '出席表示') {
            this.props.setParams({ adminFilename: value, adminPage: '出席', }, () => {
              this.props.load({ filename: '出席CSV' });
            });
          } else {
            this.props.setParams({ adminFilename: value, adminPage: '', }, () => {
              this.props.load({ filename: value });
            });
          }
        }}>
          {
            (this.props.items) ? this.props.items.map( (p, i) => {
              return <option key={i} value={p}> {p} </option>
            }) : null
          }
        </select>
        <div style={{ display: 'inline', float: 'right' }}>
          <p style={{ display: 'inline', fontSize: 12}}> { this.props.name } </p>
          <input style={{ display: 'inline',}} type="button" value="名前の変更" onClick={this.rename}/>
        </div>
        {
          (this.props.adminPage === '') ? <AceEditor
            ref={ r => this.editor = r }
            mode="example"
            theme="monokai"
            value={this.state.value}
            width="100"
            height={(this.props.height-40)+"px"}
            onChange={this.onChange}
            showPrintMargin={false}
            fontSize={18}
            onCursorChange={this.onCursorChange}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{$blockScrolling: Infinity}}
          /> : null
        }
        {
          (this.props.adminPage === '出席') ? <CSVTable
            value={this.state.value}
          /> : null
        }
        {
          (this.props.adminPage === '集計') ? <div
            style={{
              width: "100%",
              height: (this.props.height-40)+"px",
            }}
          >
            <AdminResult
              result={this.props.result}
              quizId={this.props.adminQuizId}
              startTime={this.props.adminStartTime}
              playerName={this.props.adminPlayerName}
              onChangeResult={(quizId, startTime, playerName) => {
                this.props.loadResult(quizId, startTime, playerName, () => {
                });
              }}
            />
          </div> : null
        }
      </div>
    )
  }

  renderTitle() {
    return (
      <div className="App">
        <Column style={{ height: '100%', }}>
          <div style={{ margin: 'auto', width: '100%', }}>
            <div style={{ marginBottom: 100, }}>
              <p style={{
                overflow: 'hidden',
                fontSize: this.props.fontSize,
                textAlign: 'middle',
                margin: 8,
                flex: 1,
              }}> 管理者ページ </p>
              <div style={{ fontSize: this.props.fontSize*0.5, flex: 1, margin: 30, marginBottom: 0 }}>
                <label> あなたの名前： </label>
                <input ref={ d => this.entryName = d } type="text" className="Name-Input"/>
              </div>
              {/* <select name="members" style={{
                appearance: 'none',
                marginLeft: 100,
                marginBottom: 30,
                border: '1px solid #999',
                //background: '#eee',
                width: '25%',
                height: 32,
              }} onChange={(event) => {
                if (event.target.value !== '-') {
                  this.entryName.value = event.target.value;
                }
              }}>
                {
                  (this.props.members) ? this.props.members.map( (p,i) => {
                    return <option key={i} value={p}> {p} </option>
                  }) : null
                }
              </select> */}
              <div style={{
                flex: 1,
                width: '30%',
                margin: 'auto',
              }}>
                <div>
                  <Button onClick={this.startQuiz}>
                    {
                      buttonValue("スタート", this.props.fontSize*4)
                    }
                  </Button>
                </div>
                <div>
                  <form method="GET" action="/logout/admin">
                    <input className="logoutButton" type="submit" value="logout" />
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Column>
      </div>
    )
  }
}

App.defaultProps = {
  width: window.innerWidth,
  height: window.innerHeight,
  fontSize: 16,
}

export default connect(
  state => ( {
    result: state.app.result,
    adminQuizId: state.app.adminQuizId,
    adminStartTime: state.app.adminStartTime,
    adminPlayerName: state.app.adminPlayerName,
    name: state.app.name,
    text: state.app.text,
    fontSize: state.app.fontSize,
    width: state.app.width,
    height: state.app.height,
    members: state.app.members,
    items: ['出席表示', '集計表示', '出席CSV', '日付リスト', '生徒リスト'],
    adminFilename: state.app.adminFilename,
    adminPage: state.app.adminPage,
  } ),
  dispatch => ( {
    playSpeech: (text, callback) => dispatch( playSpeech(text, callback) ),
    stopSpeech: (text, callback) => dispatch( stopSpeech(text, callback) ),
    playScenario: (text, range, callback) => dispatch( playScenario(text, range, callback) ),
    stopScenario: (callback) => dispatch( stopScenario(callback) ),
    save: (text, callback) => dispatch( save(text, callback) ),
    load: (option, callback) => dispatch( load(option, callback) ),
    list: (callback) => dispatch( list(callback) ),
    onLayout: (size) => dispatch( changeLayout(size) ),
    setParams: (payload, callback) => dispatch( setParams(payload, callback) ),
    loadResult: (quizId, startTime, playerName, callback) => dispatch( loadResult(quizId, startTime, playerName, callback) ),
  })
)(App);
