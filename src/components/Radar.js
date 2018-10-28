import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';

const cfg = {
  radius: 350,
  factor: 1,
  radians: 2 * Math.PI,
  w: 1000,
  h: 1000,
  color: '#1f77b4',
  opacityArea: 0.5,
  levels: 5,
}

export default class Radar extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.cfg = {
      ...cfg,
    }
  }

  componentWillMount() {
  }

  initUpdate = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const svg = this.svg;
    const minsize = Math.min(width, height);

    this.xScale
      .domain([-(cfg.w/2)*width/minsize, (cfg.w/2)*width/minsize])
      .range([0, width]);
    this.yScale
      .domain([-(cfg.h/2)*height/minsize, (cfg.h/2)*height/minsize])
      .range([0, height]);

    this.base.selectAll('g')
      .remove()

    this.updateArea();
  }

  componentDidMount() {
    if (this.initialized) {
      this.initUpdate();
    } else {
      this.initializeSVG();
    }
  }

  componentDidUpdate() {
    if (this.initialized) {
      this.initUpdate();
    } else {
      this.initializeSVG();
    }
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.legend !== nextProps.legend) {
      this.forceUpdate();
    }
    if (this.props.data !== nextProps.data) {
      this.forceUpdate();
    }
  }

  initializeSVG = () => {
    const self = this;
    const { data } = this.props;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const minsize = Math.min(width, height);
    const svg = this.svg;
    this.svgBase = d3.select(this.base);

    this.xScale = d3.scaleLinear()
      .domain([-(cfg.w/2)*width/minsize, (cfg.w/2)*width/minsize])
      .range([0, width]);
    this.yScale = d3.scaleLinear()
      .domain([-(cfg.h/2)*height/minsize, (cfg.h/2)*height/minsize])
      .range([0, height]);

    this.updateArea();

    this.initialized = true;
  }

  updateArea = () => {
    const self = this;
    const cfg = this.cfg;
    const total = this.props.legend.length;

    var axis = this.base.selectAll('.axis')
      .data(this.props.legend)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axis.append('line')
      .attr('x1', self.xScale(0))
      .attr('y1', self.yScale(0))
      .attr('x2', function(d, i){return self.xScale(-cfg.radius*cfg.factor*Math.sin(i*cfg.radians/total));})
      .attr('y2', function(d, i){return self.yScale(-cfg.radius*cfg.factor*Math.cos(i*cfg.radians/total));})
      .attr('class', 'line')
      .style('stroke', 'grey')
      .style('stroke-width', '1px');

    for(var j=0; j<cfg.levels; j++){
      const levelFactor = cfg.radius*(j+1)/cfg.levels;
      const levels = this.base.selectAll(`g.levels-${j}`)
        .data([j])
        .enter()
        .append('g')
        .attr('class', `levels-${j}`);
      levels.selectAll(`line.levels-${j}`)
        .data(this.props.legend)
        .enter()
        .append('line')
        .attr('class', `levels-${j}`)
        .attr('x1', function(d, i){return self.xScale(-levelFactor*cfg.factor*Math.sin(i*cfg.radians/total));})
        .attr('y1', function(d, i){return self.yScale(-levelFactor*cfg.factor*Math.cos(i*cfg.radians/total));})
        .attr('x2', function(d, i){return self.xScale(-levelFactor*cfg.factor*Math.sin((i+1)*cfg.radians/total));})
        .attr('y2', function(d, i){return self.yScale(-levelFactor*cfg.factor*Math.cos((i+1)*cfg.radians/total));})
        .style('stroke', 'grey')
        .style('stroke-opacity', '0.75')
        .style('stroke-width', '0.3px')
    }


    const area = this.base.selectAll(`g.area`)
      .data([1])
      .enter()
      .append('g')
      .attr('class', `area`);

   area.selectAll('.area')
      .data([this.props.data])
      .enter()
      .append('polygon')
      .classed('area', true)
      .style('stroke-width', '2px')
      .style('stroke', cfg.color)
      .attr('points',function(d) {
        var str='';
        for(var i=0;i<d.length;i++){
          const v = d[i];
          const x = self.xScale(-cfg.radius*v*cfg.factor*Math.sin(i*cfg.radians/total));
          const y = self.yScale(-cfg.radius*v*cfg.factor*Math.cos(i*cfg.radians/total));
          str+=x+","+y+" ";
        }
        return str;
      })
      .style("fill", cfg.color)
      .style("fill-opacity", cfg.opacityArea)

    area.selectAll('.nodes')
      .data(this.props.data)
      .enter()
      .append('circle')
      .classed('nodes', true)
      .attr('r', '5px')
      .attr("alt", function(d){return Math.max(d, 0)})
      .attr("cx", function(v, i){
        return self.xScale(-cfg.radius*v*cfg.factor*Math.sin(i*cfg.radians/total));
      })
      .attr("cy", function(v, i){
        return self.yScale(-cfg.radius*v*cfg.factor*Math.cos(i*cfg.radians/total));
      })
      .style("fill", cfg.color)
      .style("fill-opacity", .9)

    axis.append('text')
      .attr('class', 'legend')
      .text(function(d){return d})
      .style('font-family', 'sans-serif')
      .style('font-size', '18px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.25em')
      //.attr('transform', function(d, i){return 'translate(0, -10)'})
      .attr('x', function(d, i){return self.xScale(-cfg.radius*cfg.factor*1.2*Math.sin(i*cfg.radians/total));})
      .attr('y', function(d, i){return self.yScale(-cfg.radius*cfg.factor*1.2*Math.cos(i*cfg.radians/total));});

  }

  render() {
    const style = {
      position: 'relative',
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100%',
      border: 'solid 1px lightgray',
      ...this.props.style,
    }
    return (
      <div
        ref={n => this.container = n}
        style={style}
      >
        <svg
          ref={n => this.svg = d3.select(n)}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <g ref={n => this.base = d3.select(n)} />
        </svg>
      </div>
    )
  }
}

Radar.defaultProps = {
  legend: [],
  data: [],
}
