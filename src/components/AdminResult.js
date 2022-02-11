import React, { Component } from "react";
import { fontSize } from "../reducers";
import Radar from "./Radar";

function dateStr(datestring) {
  const d = new Date(datestring);
  //d.setHours(d.getHours()-9);
  return `${d.getFullYear()}/${
    d.getMonth() + 1
  }/${d.getDate()} ${d.getHours()}時`;
}

class AdminResult extends Component {
  constructor(props) {
    super(props);
  }

  onChangeResultHandler = (quizId, startTime, name) => {
    return e => {
      //e.stopPropagation();
      e.nativeEvent.preventDefault();
      if (this.props.onChangeResult)
        this.props.onChangeResult(
          quizId ? quizId : "",
          startTime ? startTime : "",
          name ? name : ""
        );
    };
  };

  render() {
    const { result, quizId, startTime, playerName } = this.props;
    if (quizId) {
      if (startTime) {
        const categories = {};
        const radar = {
          legend: [],
          data: [],
        };
        {
          const { quiz } = result.question;
          {
            Object.keys(quiz).forEach(key => {
              const cat = quiz[key].category;
              if (cat) {
                if (categories[cat]) {
                  //categories[cat].total ++;
                } else {
                  categories[cat] = { total: 0, point: 0 };
                }
              }
            });
          }
          if (Object.keys(categories).length > 0) {
            {
              Object.keys(result.answers).forEach(question => {
                Object.keys(result.answers[question]).forEach(clientId => {
                  const q = result.answers[question][clientId].answer;
                  if (quiz[question]) {
                    const cat = quiz[question].category;
                    if (
                      quiz[question].answers.some(p => {
                        return q === p;
                      })
                    ) {
                      categories[cat].point++;
                    }
                    categories[cat].total++;
                  }
                });
              });
            }
            Object.keys(categories)
              .sort()
              .forEach(v => {
                radar.legend.push(v);
                radar.data.push(categories[v].point / categories[v].total);
              });
          } else {
            Object.keys(quiz).forEach(question => {
              const cat = question;
              if (cat) {
                if (categories[cat]) {
                  //categories[cat].total ++;
                } else {
                  categories[cat] = { total: 0, point: 0 };
                }
              }
            });
            {
              Object.keys(result.answers).forEach(question => {
                Object.keys(result.answers[question]).forEach(clientId => {
                  const q = result.answers[question][clientId].answer;
                  if (quiz[question]) {
                    const cat = question;
                    if (
                      quiz[question].answers.some(p => {
                        return q === p;
                      })
                    ) {
                      categories[cat].point++;
                    }
                    categories[cat].total++;
                  }
                });
              });
            }
            Object.keys(categories)
              .sort()
              .forEach(v => {
                radar.legend.push(v);
                radar.data.push(categories[v].point / categories[v].total);
              });
          }
        }
        function resultItemStyle(str, q) {
          function checkItem() {
            if (result.question) {
              const { quiz } = result.question;
              if (quiz && quiz[q]) {
                return quiz[q].answers.some(v => {
                  return v == str;
                });
              }
              return null;
            }
          }
          const r = checkItem();
          if (r === true) {
            return {};
          } else if (r === false) {
            return { backgroundColor: "#ffdde3" };
          } else {
            return {};
          }
        }
        const answers = Object.keys(result.answers).sort();
        return (
          //クイズ回答一覧
          <div className="Result">
            <p>
              {playerName ? (
                <a
                  href={`?quizId=${encodeURIComponent(
                    quizId
                  )}&startTime=${startTime}`}
                  onClick={this.onChangeResultHandler(quizId, startTime)}
                >
                  {" "}
                  BACK{" "}
                </a>
              ) : (
                <a
                  href={`?quizId=${encodeURIComponent(quizId)}`}
                  onClick={this.onChangeResultHandler(quizId)}
                >
                  {" "}
                  BACK{" "}
                </a>
              )}
            </p>
            {
              <Radar
                ref={d => (this.radarView = d)}
                style={{
                  height: 400,
                }}
                legend={radar.legend}
                data={radar.data}
              />
            }
            {answers
              ? answers.map((q, i) => {
                  return (
                    <div key={i}>
                      <p className="ResultTitle">
                        {" "}
                        {q} :{" "}
                        {(() => {
                          const p = result.answers[q];
                          const total = Object.keys(p).length;
                          let collect = 0;
                          Object.keys(p).filter(clientId => {
                            if (
                              typeof resultItemStyle(p[clientId].answer, q)
                                .backgroundColor === "undefined"
                            ) {
                              collect++;
                            }
                          });
                          return `正答数 ${collect} / ${total} : 正答率 ${parseInt(
                            (collect * 100) / total
                          )}%`;
                        })()}{" "}
                      </p>
                      {Object.keys(result.answers[q])
                        .sort()
                        .filter(clientId => {
                          const name = result.answers[q][clientId].name;
                          return playerName ? name === playerName : true;
                        })
                        .map((clientId, i) => {
                          const name = result.answers[q][clientId].name;
                          return (
                            <p
                              key={i}
                              className="ResultItem"
                              style={resultItemStyle(
                                result.answers[q][clientId].answer,
                                q
                              )}
                            >
                              <a
                                style={{ width: 200, display: "inline-block" }}
                                href={`?quizId=${encodeURIComponent(
                                  quizId
                                )}&startTime=${startTime}&name=${name}`}
                                onClick={this.onChangeResultHandler(
                                  quizId,
                                  startTime,
                                  name
                                )}
                              >
                                {" "}
                                {name}{" "}
                              </a>{" "}
                              :{" "}
                              <span>
                                {" "}
                                {result.answers[q][clientId].answer}{" "}
                              </span>
                            </p>
                          );
                        })}
                    </div>
                  );
                })
              : null}
          </div>
        );
      } else {
        //クイズ時間一覧
        return (
          <div className="Result">
            <p>
              {" "}
              <a href={`?quizId`} onClick={this.onChangeResultHandler()}>
                {" "}
                BACK{" "}
              </a>{" "}
            </p>
            <p> {quizId} </p>
            {result.startTimes
              ? result.startTimes.map((startTime, i) => {
                  return (
                    <p key={i}>
                      <a
                        style={{ width: 150, display: "inline-block" }}
                        href={`?quizId=${encodeURIComponent(
                          quizId
                        )}&startTime=${startTime}`}
                        onClick={this.onChangeResultHandler(quizId, startTime)}
                      >
                        {" "}
                        {`${dateStr(startTime)}`}{" "}
                      </a>
                      <span> ({startTime}) </span>
                    </p>
                  );
                })
              : null}
          </div>
        );
      }
    } else {
      //クイズ一覧
      return (
        <div className="Result">
          {result.quizIds
            ? result.quizIds.map((quizId, i) => {
                return (
                  <p key={i}>
                    <a
                      href={`?quizId=${encodeURIComponent(quizId)}`}
                      onClick={this.onChangeResultHandler(quizId)}
                    >
                      {" "}
                      {quizId}{" "}
                    </a>
                  </p>
                );
              })
            : null}
        </div>
      );
    }
  }
}

AdminResult.defaultProps = {
  fontSize: fontSize({
    width: window.innerWidth,
    height: window.innerHeight,
  }),
  result: {},
  quizId: null,
  startTime: null,
  playerName: null,
  onChangeResult: null,
};

export default AdminResult;
