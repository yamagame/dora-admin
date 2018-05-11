//const requestTimeout = 3000;

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function timeout(callback) {
  var done = false;
  // setTimeout(() => {
  //   if (done) return;
  //   done = true;
  //   callback(new Error('timeout'), null);
  // }, timeout);
  return function(data) {
    if (done) return;
    done = true;
    callback(null, data);
  }
}

function _request(node, action, host, body, callback) {
  host.emit(action, body, timeout(callback));
}

class Play {
  constructor(){
    this.org_message = null;
    this.canceled = true;
  }

  textToSpeech(node, message, host, params, callback) {
    params.message = message;
    _request(node, 'text-to-speech', host, params, callback);
  }

  stop(node, host, callback) {
    if (this.canceled === false && host) {
      _request(node, 'stop-text-to-speech', host, {}, callback);
      this.canceled = true;
    }
  }

  delay(time, callback) {
    setTimeout(() => {
      callback(null, 'OK');
    }, time * 1000);
  }

  nextPage(node, host, callback) {
    _request(node, 'command', host, {
      command: 'right-key.cmd',
      args: '',
    }, callback);
  }

  prevPage(node, host, callback) {
    _request(node, 'command', host, {
      command: 'left-key.cmd',
      args: '',
    }, callback);
  }

  topPage(node, host, callback) {
    _request(node, 'command', host, {
      command: 'page-key.cmd',
      args: '1',
    }, callback);
  }

  openPage(node, host, page, callback) {
    _request(node, 'command', host, {
      command: 'page-key.cmd',
      args: page,
    }, callback);
  }

  quizCommand(node, host, params, callback) {
    _request(node, 'quiz-command', host, params, callback);
  }

  doShuffle() {
    for (var i=0;i<this.shuffle.length*10;i++) {
      const a = getRndInteger(0, this.shuffle.length);
      const b = getRndInteger(0, this.shuffle.length);
      const c = this.shuffle[a];
      this.shuffle[a] = this.shuffle[b];
      this.shuffle[b] = c;
    }
    this.shufflePtr = 0;
  }

  getMessage(messages) {
    if (this.org_message === null || this.org_message !== messages) {
      this.org_message = messages;
      var n = 0;
      const res = [];
      this.shuffle = [];
      messages.split('\n').forEach( (line, i) => {
        if (line !== '') {
          res.push(line.split(':'));
          this.shuffle.push(n);
          n++;
        }
      });
      this.messages = res;
      this.doShuffle();
    }
    return this.messages;
  }

  request(node, msg, params, callback) {
    if (params.silence) {
      callback(null, 'OK');
      return;
    }
    this.canceled = false;
    const { robotHost } = msg;
    const host = robotHost;
    this.host = host;
    const messages = this.getMessage(params.message).filter( line => {
      //コメント
      if (line.length > 0) {
        return (line[0].indexOf('//') !== 0)
      }
      return false;
    });
    var cmd = [];

    const doCmd = (callback) => {
      if (cmd.length <= 0 || this.canceled) {
        callback();
        return;
      }
      const d = cmd.shift().trim();
      const page = d.match('(\\d+)page') || d.match('(\\d+)ページ');
      // var delay = d.match('(\\d+)s') || d.match('(\\d+)秒');
      var delay = d.match('(^([1-9]\\d*|0)(\\.\\d+)?)s$') || d.match('(^([1-9]\\d*|0)(\\.\\d+)?)秒$');
      if (delay == null) {
        // delay = d.match('(\\d+)');
        delay = d.match('(^([1-9]\\d*|0)(\\.\\d+)?)');
      }
      var speed = d.match('(\\d+)speed') || d.match('(\\d+)スピード');
      if (speed == null) {
        speed = d.match('speed(\\d+)') || d.match('スピード(\\d+)');
      }
      var volume = d.match('(\\d+)volume') || d.match('(\\d+)音量');
      if (volume == null) {
        volume = d.match('volume(\\d+)') || d.match('音量(\\d+)');
      }
      if (d === 'next' || d.indexOf('次') >= 0) {
        this.nextPage(node, host, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'prev' || d.indexOf('前') >= 0) {
        this.prevPage(node, host, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'top' || d.indexOf('トップ') >= 0) {
        this.topPage(node, host, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'quiz.question' || d.indexOf('クイズ.送信') >= 0) {
        this.quizCommand(node, host, {
          action: 'quiz',
          question: msg.quiz.question,
          choices: msg.quiz.choices,
          time: msg.quiz.timeLimit,
          pages: msg.quiz.pages,
          sideImage: msg.quiz.sideImage,
          answers: [],
        }, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'quiz.start' || d.indexOf('クイズ.開始') >= 0 ||
          d === 'quiz.countdown' || d.indexOf('クイズ.カウントダウン') >= 0) {
        this.quizCommand(node, host, {
          action: 'start',
          question: msg.quiz.question,
          choices: msg.quiz.choices,
          time: msg.counter,
          answers: [],
        }, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'quiz.answer' || d.indexOf('クイズ.解答') >= 0) {
        this.quizCommand(node, host, {
          action: 'answer',
          question: msg.quiz.question,
          choices: msg.quiz.choices,
          answers: msg.quiz.answers,
        }, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'quiz.end' || d.indexOf('クイズ.終了') >= 0) {
        this.quizCommand(node, host, {
          action: 'wait',
        }, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d === 'quiz.timeup' || d.indexOf('クイズ.タイムアップ') >= 0) {
        this.quizCommand(node, host, {
          action: 'stop',
          question: msg.quiz.question,
          choices: msg.quiz.choices,
          time: 0,
          answers: [],
        }, (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (d.indexOf('quiz.slide') >= 0 || d.indexOf('クイズ.スライド') >= 0) {
        const m = d.match(/\/(.+)/);
        if (m) {
          this.quizCommand(node, host, {
            action: 'slide',
            photo: `${m[1]}`,
            pages: [],
          }, (err, res) => {
            if (err) {
              callback(err, 'ERR');
              return;
            }
            doCmd(callback);
          });
        } else {
          doCmd(callback);
        }
      } else
      if (d.indexOf('quiz.result') >= 0 || d.indexOf('クイズ.結果') >= 0) {
      } else
      if (d === 'marisa' || d.indexOf('魔理沙') >= 0) {
        params.voice = 'marisa';
        doCmd(callback);
      } else
      if (d === 'reimu' || d.indexOf('霊夢') >= 0) {
        params.voice = 'reimu';
        doCmd(callback);
      } else
      if (d === 'speed' || d.indexOf('スピード') >= 0) {
        params.speed = speed[1];
        doCmd(callback);
      } else
      if (d === 'volume' || d.indexOf('音量') >= 0) {
        params.volume = volume[1];
        doCmd(callback);
      } else
      if (d === 'left' || d.indexOf('左') >= 0) {
        params.direction = 'left';
        doCmd(callback);
      } else
      if (d === 'center' || d.indexOf('中') >= 0) {
        params.direction = 'center';
        doCmd(callback);
      } else
      if (d === 'right' || d.indexOf('右') >= 0) {
        params.direction = 'right';
        doCmd(callback);
      } else
      if (page !== null) {
        this.openPage(node, host, page[1], (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else
      if (delay !== null) {
        this.delay(parseFloat(delay[1]), (err, res) => {
          if (err) {
            callback(err, 'ERR');
            return;
          }
          doCmd(callback);
        });
      } else {
        doCmd(callback);
      }
    }

    function checkMessage(messages) {
      return messages.some( m => {
        return (m[0] !== '');
      });
    }

    if (params.algorithm === 'shuffle') {
      const ptr = this.shufflePtr;
      let done = false;
      if (!checkMessage(messages)) {
        callback(null, '');
      } else {
        while (!this.canceled) {
          if (this.shufflePtr >= this.shuffle.length) {
            this.shufflePtr = 0;
            break;
          }
          let msg = messages[this.shuffle[this.shufflePtr]][0];
          if (msg === '') {
          } else {
            if (params.silence) {
              callback(null, msg);
            } else {
              this.textToSpeech(node, msg, host, params, (err, res) => {
                callback(err, msg);
              });
            }
            done = true;
          }
          this.shufflePtr++;
          if (this.shufflePtr >= this.shuffle.length) {
            this.doShuffle();
          }
          //一周するか発話したら終了
          if (ptr === this.shufflePtr || done) break;
        }
      }
    } else
    if (params.algorithm === 'random') {
      this.doShuffle();
      const ptr = this.shufflePtr;
      let done = false;
      if (!checkMessage(messages)) {
        callback(null, '');
      } else {
        while (!this.canceled) {
          if (this.shufflePtr >= this.shuffle.length) {
            this.shufflePtr = 0;
            break;
          }
          let msg = messages[this.shuffle[this.shufflePtr]][0];
          if (msg === '') {
          } else {
            if (params.silence) {
              callback(null, msg);
            } else {
              this.textToSpeech(node, msg, host, params, (err, res) => {
                callback(err, msg);
              });
            }
            done = true;
          }
          this.shufflePtr++;
          if (this.shufflePtr >= this.shuffle.length) {
            this.doShuffle();
          }
          //一周するか発話したら終了
          if (ptr === this.shufflePtr || done) break;
        }
      }
    } else
    if (params.algorithm === 'onetime') {
      const ptr = this.shufflePtr;
      let done = false;
      if (!checkMessage(messages)) {
        callback(null, '');
      } else {
        while (!this.canceled) {
          if (this.shufflePtr >= messages.length) {
            this.shufflePtr = 0;
            break;
          }
          let msg = messages[this.shufflePtr][0];
          if (msg === '') {
          } else {
            if (params.silence) {
              callback(null, msg);
            } else {
              this.textToSpeech(node, msg, host, params, (err, res) => {
                callback(err, msg);
              });
            }
            done = true;
          }
          this.shufflePtr++;
          if (this.shufflePtr >= this.shuffle.length) {
            this.doShuffle();
          }
          //一周するか発話したら終了
          if (ptr === this.shufflePtr || done) break;
        }
      }
    } else {
      var i = 0;
      const play = () => {
        if (i >= messages.length || this.canceled) {
          callback(null, 'OK');
          return;
        }
        var msg = '';
        cmd = [];
        function push(v) {
           cmd.push(v);
        }
        for (;i<messages.length;i++) {
          if (messages[i][0] !== '') {
            if (msg !== '') msg += "\n";
            msg += messages[i][0];
          }
          if (messages[i].length > 1) {
            messages[i].forEach(push);
            cmd = cmd.slice(1);
            i++;
            break;
          }
        }
        node.log(cmd);
        if (msg === '') {
          if (cmd.length > 0) {
            doCmd(() => {
              play();
            });
          } else {
            play();
          }
        } else {
          if (params.silence) {
            if (cmd.length > 0) {
              doCmd(() => {
                play();
              });
            } else {
              play();
            }
          } else {
            this.textToSpeech(node, msg, host, params, (err, res) => {
              if (err) {
                callback(err, 'ERR');
                return;
              }
              if (cmd.length > 0) {
                doCmd(() => {
                  play();
                });
              } else {
                play();
              }
            });
          }
        }
      }
      play();
    }
  }
}

export default Play;
