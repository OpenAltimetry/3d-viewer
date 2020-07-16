/*
Author: Kai Lin - klin (at) sdsc.edu
07/16/2020
Copyright (c) 2007 The Regents of the University of California

Permission to use, copy, modify, and distribute this software and its documentation
for educational, research and non-profit purposes, without fee, and without a written
agreement is hereby granted, provided that the above copyright notice, this
paragraph and the following three paragraphs appear in all copies.

Permission to make commercial use of this software may be obtained
by contacting:
Technology Transfer Office
9500 Gilman Drive, Mail Code 0910
University of California
La Jolla, CA 92093-0910
(858) 534-5815
invent@ucsd.edu

THIS SOFTWARE IS PROVIDED BY THE REGENTS OF THE UNIVERSITY OF CALIFORNIA AND
CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT
NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import React, {Component} from 'react';
import DeckGL from '@deck.gl/react';
import {OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import AxesLayer from "./plot-layer/axes-layer";
import {scaleLinear} from 'd3-scale';

import 'antd/dist/antd.css';
import {Typography} from 'antd';

const {Title} = Typography;
//const {Option} = Select;

class OpenAltimetryPhoton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            viewState: {
                target: [50, 20, 60],
                rotationX: 12,
                rotationOrbit: -75,
                orbitAxis: 'Z',
                fov: 50,
                minZoom: 0,
                maxZoom: 50,
                zoom: 0.2,
                container: 'deck',
            },
            high: [],
            medium: [],
            low: []
        };

        this._onViewStateChange = this._onViewStateChange.bind(this);
        this._onHover1 = this._onHover1.bind(this);
        this._onHover2 = this._onHover2.bind(this);
        this._onHover3 = this._onHover3.bind(this);
        this._renderTooltip = this._renderTooltip.bind(this);
    }

    componentDidMount() {

        let high = this.props.high;
        let medium = this.props.medium;
        let low = this.props.low;
        let metadata = this.props.metadata;

        let minlat = metadata.miny;
        let maxlat = metadata.maxy;
        let minlng = metadata.minx;
        let maxlng = metadata.maxx;
        let minele = metadata.minz;
        let maxele = metadata.maxz;

        let latdiff = maxlat - minlat;
        let lngdiff = maxlng - minlng;
        let elediff = maxele - minele;

        console.log("\n------ lat ------");
        console.log("min lat=" + minlat);
        console.log("max lat=" + maxlat);
        console.log("lat diff=" + latdiff);

        let lat_delta = latdiff / 10;
        minlat = Math.floor((minlat - lat_delta) * 100);
        maxlat = Math.ceil((maxlat + lat_delta) * 100);
        latdiff = maxlat - minlat;

        minlat = minlat / 100;
        maxlat = maxlat / 100;
        latdiff = latdiff / 100;

        console.log("\nnew min lat=" + minlat);
        console.log("new max lat=" + maxlat);
        console.log("new lat diff=" + latdiff);

        console.log("\n------ lng ------");
        console.log("min lng=" + minlng);
        console.log("max lng=" + maxlng);
        console.log("lng diff=" + lngdiff);

        let lng_delta = lngdiff / 10;
        minlng = Math.floor((minlng - lng_delta) * 100);
        maxlng = Math.ceil((maxlng + lng_delta) * 100);
        lngdiff = maxlng - minlng;

        minlng = minlng / 100;
        maxlng = maxlng / 100;
        lngdiff = lngdiff / 100;

        console.log("\nnew min lng=" + minlng);
        console.log("new max lng=" + maxlng);
        console.log("new lng diff=" + lngdiff);

        console.log("\n------ elevation ------");
        console.log("min ele=" + minele);
        console.log("max ele=" + maxele);
        console.log("ele diff=" + elediff);

        let ele_delta = Math.round(elediff / 10);
        minele = Math.floor(minele - ele_delta);
        maxele = Math.ceil(maxele + ele_delta);
        elediff = maxele - minele;

        console.log("\nnew min ele=" + minele);
        console.log("new max ele=" + maxele);
        console.log("new ele diff=" + elediff);
        console.log("\n");

        let xScale = scaleLinear().domain([minlng, maxlng]).range([-200, 200]);
        let yScale = scaleLinear().domain([minele, maxele]).range([0, 200]);
        let zScale = scaleLinear().domain([minlat, maxlat]).range([-200, 200]);

        let resultLow = [];
        for (var i = 0; i < low.length; i++) {
            resultLow.push({
                position: [xScale(low[i].lng), zScale(low[i].lat), yScale(low[i].height)],
                beam: low[i].beam
            });
        }

        let resultMedium = [];
        for (i = 0; i < medium.length; i++) {
            resultMedium.push({
                position: [xScale(medium[i].lng), zScale(medium[i].lat), yScale(medium[i].height)],
                beam: medium[i].beam
            });
        }

        let resultHigh = [];
        for (i = 0; i < high.length; i++) {
            resultHigh.push({
                position: [xScale(high[i].lng), zScale(high[i].lat), yScale(high[i].height)],
                beam: high[i].beam
            });
        }

        this.setState({
            minlng, maxlng, minlat, maxlat, minele, maxele,
            low: resultLow,
            medium: resultMedium,
            high: resultHigh
        });

    }

    _onViewStateChange({viewState}) {
        this.setState({viewState});
    }

    _onHover1 = ({object, x, y}) => {
        if (object) {
            let lng = object.position[0];
            let lat = object.position[1];
            let ele = object.position[2];

            const xScale = scaleLinear().domain([this.state.minlng, this.state.maxlng]).range([-200, 200]);
            const yScale = scaleLinear().domain([this.state.minele, this.state.maxele]).range([0, 200]);
            const zScale = scaleLinear().domain([this.state.minlat, this.state.maxlat]).range([-200, 200]);

            this.setState({
                hover_info: {
                    x, y,
                    lat: zScale.invert(lat),
                    lng: xScale.invert(lng),
                    ele: yScale.invert(ele),
                    confidence: 'high',
                    beam: object.beam,
                }
            })
        } else {
            this.setState({hover_info: null});
        }

    }

    _onHover2 = ({object, x, y}) => {
        if (object) {

            let lng = object.position[0];
            let lat = object.position[1];
            let ele = object.position[2];

            const xScale = scaleLinear().domain([this.state.minlng, this.state.maxlng]).range([-200, 200]);
            const yScale = scaleLinear().domain([this.state.minele, this.state.maxele]).range([0, 200]);
            const zScale = scaleLinear().domain([this.state.minlat, this.state.maxlat]).range([-200, 200]);

            this.setState({
                hover_info: {
                    x, y,
                    lat: zScale.invert(lat),
                    lng: xScale.invert(lng),
                    ele: yScale.invert(ele),
                    confidence: 'medium',
                    beam: object.beam,
                }
            })
        } else {
            this.setState({hover_info: null});
        }

    }

    _onHover3 = ({object, x, y}) => {
        if (object) {

            let lng = object.position[0];
            let lat = object.position[1];
            let ele = object.position[2];

            const xScale = scaleLinear().domain([this.state.minlng, this.state.maxlng]).range([-200, 200]);
            const yScale = scaleLinear().domain([this.state.minele, this.state.maxele]).range([0, 200]);
            const zScale = scaleLinear().domain([this.state.minlat, this.state.maxlat]).range([-200, 200]);

            this.setState({
                hover_info: {
                    x, y,
                    lat: zScale.invert(lat),
                    lng: xScale.invert(lng),
                    ele: yScale.invert(ele),
                    confidence: 'low',
                    beam: object.beam,
                }
            })
        } else {
            this.setState({hover_info: null});
        }

    }


    _renderTooltip() {
        const {hover_info} = this.state;
        return (
            hover_info && (
                <div className="tooltip"
                     style={{
                         zIndex: 1000,
                         position: 'absolute',
                         left: hover_info.x,
                         top: hover_info.y,
                         padding: '5pt 10pt 5pt 10pt',
                         backgroundColor: '#fff',
                         borderWidth: '1px',
                         borderStyle: 'solid',
                         borderBottomColor: '#aaa',
                         borderRightColor: '#aaa',
                         borderTopColor: '#ddd',
                         borderLeftColor: '#ddd',
                         borderRadius: '3px',
                         MozBorderRadius: '3px',
                         WebkitBorderRadius: '3px',
                         fontSize: '8pt'
                     }}>
                    <table>
                        <tbody>
                        <tr>
                            <td>Latitude:</td>
                            <td>{hover_info.lat.toFixed(4)}</td>
                        </tr>
                        <tr>
                            <td>Longitude:</td>
                            <td>{hover_info.lng.toFixed(4)}</td>
                        </tr>
                        <tr>
                            <td>Height:</td>
                            <td>{hover_info.ele.toFixed(4)}</td>
                        </tr>
                        <tr>
                            <td>Beam:</td>
                            <td>{hover_info.beam}</td>
                        </tr>
                        <tr>
                            <td>Confidence:</td>
                            <td>{hover_info.confidence}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )
        );
    }

    render() {
        const {viewState} = this.state;
        const xScale = scaleLinear().domain([this.state.minlng, this.state.maxlng]).range([-200, 200]);
        const yScale = scaleLinear().domain([this.state.minele, this.state.maxele]).range([0, 200]);
        const zScale = scaleLinear().domain([this.state.minlat, this.state.maxlat]).range([-200, 200]);

        const layers = [
            new PointCloudLayer({
                id: 'high_photon',
                pickable: true,
                onHover: this._onHover1,
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                coordinateOrigin: [0, 0, 0],  // anchor point in longitude/latitude/altitude
                data: this.state.high,
                getPosition: d => d.position,
                getNormal: [0, 0, 1],
                //getColor: [0, 0, 255, 100],
                getColor: [0, 0, 245, 120],
                opacity: 0.5,
                pointSize: 0.4
            }),
            new PointCloudLayer({
                id: 'medium_photon',
                pickable: true,
                onHover: this._onHover2,
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                coordinateOrigin: [0, 0, 0],  // anchor point in longitude/latitude/altitude
                data: this.state.medium,
                getPosition: d => d.position,
                getNormal: [0, 0, 1],
                //getColor: [124, 252, 0],
                getColor: [117, 252, 76, 120],
                opacity: 0.5,
                pointSize: 0.4
            }),
            new PointCloudLayer({
                id: 'low_photon',
                pickable: true,
                onHover: this._onHover3,
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                coordinateOrigin: [0, 0, 0],  // anchor point in longitude/latitude/altitude
                data: this.state.low,
                getPosition: d => d.position,
                getNormal: [0, 0, 1],
                //getColor: [240, 255, 255],
                getColor: [234, 51, 247, 120],
                opacity: 0.5,
                pointSize: 0.4
            }),
            new AxesLayer(
                {
                    xScale: xScale,    // longitude
                    yScale: yScale,      // elevation
                    zScale: zScale,       // latitude
                    fontSize: 12,
                    xTicks: 4,
                    yTicks: 5,
                    zTicks: 5,
                    xTickFormat: x => x === this.state.minlng || x === this.state.maxlng ? '' : x.toFixed(2), //x => x.toFixed(2),
                    yTickFormat: y => y.toFixed(2), //x => x.toFixed(2),
                    zTickFormat: z => z === this.state.minlat || z === this.state.maxlat ? '' : z.toFixed(2), //x => x.toFixed(2),
                    xTitle: 'longitude (degree)                                               ',
                    yTitle: 'height (meter)',
                    zTitle: 'latitude (degree)',
                    padding: 0,
                    color: [0, 0, 0, 100],
                    coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                })
        ];

        return (
            <div style={{position: "relative", margin: '20pt 10vw 20pt 10vw'}}>
                <table border={0}>
                    <tbody>
                    <tr>
                        <td style={{textAlign: 'center', padding: '0pt 0pt 10pt 0pt'}}>
                            <Title level={4}>
                                ATL03 Return Signal Photons:
                                Track {this.props.metadata.trackid} on {this.props.metadata.date}
                            </Title>

                            <div style={{verticalAlign: 'top', textAlign: 'center'}}>
                                <table border={0} style={{width: '100%'}}>
                                    <tbody>
                                    <tr>
                                        <td style={{width: 'calc(50%-230)'}}></td>
                                        <td style={{
                                            width: '460px',
                                            maxWidth: '100%',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}>
                                            <ul style={{listStyle: 'none'}}>
                                                <li style={{float: 'left', marginRight: '10px'}}>
                                                    <span style={{
                                                        //backgroundColor: 'rgba(0, 0, 255, 100)',
                                                        backgroundColor: 'rgba(0, 0, 245)',
                                                        border: '1px solid #ccc',
                                                        float: 'left',
                                                        width: '10px',
                                                        height: '10px',
                                                        margin: '6px 5px'
                                                    }}></span>
                                                    <span style={{paddingRight: 10}}><b>high:</b> {this.state.high.length}</span>
                                                </li>

                                                <li style={{float: 'left', marginRight: '10px'}}>
                                                    <span style={{
                                                        //backgroundColor: 'rgb(124, 252, 0)',
                                                        backgroundColor: 'rgb(117, 252, 76)',
                                                        border: '1px solid #ccc',
                                                        float: 'left',
                                                        width: '10px',
                                                        height: '10px',
                                                        margin: '6px 5px'
                                                    }}></span>
                                                    <span style={{paddingRight: 10}}><b>medium:</b> {this.state.medium.length}</span>
                                                </li>

                                                <li style={{float: 'left', marginRight: '10px'}}>
                                                    <span style={{
                                                        //backgroundColor: 'rgb(240, 255, 255)',
                                                        backgroundColor: 'rgb(234, 51, 247)',
                                                        border: '1px solid #ccc',
                                                        float: 'left',
                                                        width: '10px',
                                                        height: '10px',
                                                        margin: '6px 5px'
                                                    }}></span>
                                                    <span style={{paddingRight: 10}}><b>low:</b> {this.state.low.length}</span>
                                                </li>

                                            </ul>
                                        </td>
                                        <td style={{width: 'calc(50%-230)'}}></td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/*
                            <span style={{paddingRight: 10}}><b>high:</b> {this.state.high.length}</span>
                            <span style={{paddingRight: 10}}><b>medium:</b> {this.state.medium.length}</span>
                            <span style={{paddingRight: 10}}><b>low:</b> {this.state.low.length}</span>
                            */}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="1">
                            <DeckGL
                                views={new OrbitView()}
                                viewState={viewState}
                                controller={true}
                                onViewStateChange={this._onViewStateChange}
                                layers={layers}
                                parameters={{
                                    clearColor: [0.93, 0.86, 0.81, 1]
                                }}
                                width={'80vw'}
                                height={'75vh'}
                                getCursor={() => "default"}
                                style={{position: 'relative', border: '2px solid #ccc'}}
                            >
                                {this._renderTooltip}
                            </DeckGL>
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding: '5pt 10pt 5pt 10pt'}}>
                            This viewer supports the following interactions:
                            <ul>
                                <li><b>dragRotate</b>: Drag to rotate</li>
                                <li><b>dragPan</b>: Drag while pressing shift/ctrl to pan</li>
                                <li><b>scrollZoom</b>: Mouse wheel to zoom</li>
                                <li><b>doubleClickZoom</b>: Double click to zoom in, with shift/ctrl down to zoom out</li>
                                <li><b>touchZoom</b>: Pinch zoom</li>
                                <li><b>keyboard</b>: Keyboard (arrow keys to pan, arrow keys with shift/ctrl down to rotate, +/- to zoom)</li>
                            </ul>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

}

export default OpenAltimetryPhoton;
