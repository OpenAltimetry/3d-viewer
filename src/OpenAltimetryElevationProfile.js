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
import {Typography, Select} from 'antd';

const {Title} = Typography;
const {Option} = Select;


class OpenAltimetryElevationProfile extends Component {

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
                maxZoom: 30,
                zoom: 0.2,
                container: 'deck',
            },
            dates: [],

            // attributes for photons
            photon_data_loaded: false,
        };

        this._onViewStateChange = this._onViewStateChange.bind(this);
        this._onHover = this._onHover.bind(this);
        this._renderTooltip = this._renderTooltip.bind(this);
    }

    componentDidMount() {

        let datasets = this.props.data.data;
        let counts = {};
        let dates = [];
        let dateIndex = [];
        let latestIndex = -1;
        for (var i = 0; i < datasets.length; i++) {
            counts[datasets[i].date] = 0;
            for (var j = 0; j < datasets[i].beams.length; j++) {
                if (datasets[i].beams[j].lat_lon_elev_canopy) {
                    counts[datasets[i].date] += datasets[i].beams[j].lat_lon_elev_canopy.length;
                    console.log(datasets[i].date + " : " + datasets[i].beams[j].beam + " : " + datasets[i].beams[j].lat_lon_elev_canopy.length);
                } else {
                    counts[datasets[i].date] += datasets[i].beams[j].lat_lon_elev.length;
                    console.log(datasets[i].date + " : " + datasets[i].beams[j].beam + " : " + datasets[i].beams[j].lat_lon_elev.length);
                }
            }
            if (counts[datasets[i].date] > 0) {
                latestIndex = i;
                dates.push(datasets[i].date);
                dateIndex.push(i);
            }
        }
        console.log(JSON.stringify(counts) + "  " + latestIndex);
        console.log("dates = " + JSON.stringify(dates));

        this.setState({
            dates: dates,
            dateIndex: dateIndex,
            product: this.props.data.product,
            trackId: this.props.data.trackId,
            currentIndex: latestIndex
        });

        this.switchToIndex(latestIndex);

    }

    switchToIndex = (latestIndex) => {

        let datasets = this.props.data.data;

        let minlat = 90;
        let maxlat = -90;
        let minlng = 180;
        let maxlng = -180;
        let minele = 10000;
        let maxele = -10000;
        for (var i = 0; i < datasets[latestIndex].beams.length; i++) {
            if (datasets[latestIndex].beams[i].lat_lon_elev_canopy) {
                for (var j = 0; j < datasets[latestIndex].beams[i].lat_lon_elev_canopy.length; j++) {
                    let item = datasets[latestIndex].beams[i].lat_lon_elev_canopy[j];

                    let lng = item[1];
                    let lat = item[0];
                    let ele = item[2];

                    minlat = Math.min(lat, minlat);
                    maxlat = Math.max(lat, maxlat);

                    minlng = Math.min(lng, minlng);
                    maxlng = Math.max(lng, maxlng);

                    minele = Math.min(ele, minele);
                    maxele = Math.max(ele, maxele);
                }
            } else {
                for (var j = 0; j < datasets[latestIndex].beams[i].lat_lon_elev.length; j++) {
                    let item = datasets[latestIndex].beams[i].lat_lon_elev[j];

                    let lng = item[1];
                    let lat = item[0];
                    let ele = item[2];

                    minlat = Math.min(lat, minlat);
                    maxlat = Math.max(lat, maxlat);

                    minlng = Math.min(lng, minlng);
                    maxlng = Math.max(lng, maxlng);

                    minele = Math.min(ele, minele);
                    maxele = Math.max(ele, maxele);
                }
            }

        }

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

        let result = [];
        for (i = 0; i < datasets[latestIndex].beams.length; i++) {

            let color = [255, 255, 255];
            if (i === 0) {
                //color = [255, 160, 122];
                color = [249, 219, 86, 150];
            } else if (i === 1) {
                //color = [255, 235, 245];
                color = [176, 215, 104, 150];
            } else if (i === 2) {
                //color = [135, 206, 250];
                color = [219, 143, 192, 150];
            } else if (i === 3) {
                //color = [0, 255, 255];
                color = [145, 160, 200, 150];
            } else if (i === 4) {
                //color = [60, 179, 113];
                color = [237, 146, 107, 150];
            } else if (i === 5) {
                //color = [250, 218, 94];
                color = [116, 178, 155, 150];
            }

            if (datasets[latestIndex].beams[i].lat_lon_elev_canopy) {
                for (j = 0; j < datasets[latestIndex].beams[i].lat_lon_elev_canopy.length; j++) {
                    let item = datasets[latestIndex].beams[i].lat_lon_elev_canopy[j];
                    let lng = item[1];
                    let lat = item[0];
                    let ele = item[2];
                    result.push({position: [xScale(lng), zScale(lat), yScale(ele)], color: color, beam: i});
                }
            } else {
                for (j = 0; j < datasets[latestIndex].beams[i].lat_lon_elev.length; j++) {
                    let item = datasets[latestIndex].beams[i].lat_lon_elev[j];
                    let lng = item[1];
                    let lat = item[0];
                    let ele = item[2];
                    result.push({position: [xScale(lng), zScale(lat), yScale(ele)], color: color, beam: i});
                }
            }

        }

        this.setState({
            minlng, maxlng, minlat, maxlat, minele, maxele,
            data: result
        });
    }

    _onViewStateChange({viewState}) {
        this.setState({viewState});
    }

    _onHover() {
        console.log("yes");
    }

    getBeamName = (index) => {
        if (index === 0) {
            return 'gt1l';
        } else if (index === 1) {
            return 'gt1r';
        } else if (index === 2) {
            return 'gt2l';
        } else if (index === 3) {
            return 'gt2r';
        } else if (index === 4) {
            return 'gt3l';
        } else if (index === 5) {
            return 'gt3r';
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
                            <td>Elevation:</td>
                            <td>{hover_info.ele.toFixed(4)}</td>
                        </tr>
                        <tr>
                            <td>Beam:</td>
                            <td>{this.getBeamName(hover_info.beam)}</td>
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
                id: 'pointCloud',
                pickable: true,
                onHover: ({object, x, y}) => {
                    if (object) {
                        let lng = object.position[0];
                        let lat = object.position[1];
                        let ele = object.position[2];

                        this.setState({
                            hover_info: {
                                x, y,
                                lat: zScale.invert(lat),
                                lng: xScale.invert(lng),
                                ele: yScale.invert(ele),
                                beam: object.beam
                            }
                        })
                    } else {
                        this.setState({hover_info: null});
                    }
                },
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                coordinateOrigin: [0, 0, 0],  // anchor point in longitude/latitude/altitude
                data: this.state.data,
                getPosition: d => d.position,
                getNormal: [0, 0, 1],
                getColor: d => d.color,
                pointSize: 1
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
                    xTitle: 'longitude (degree)                         ',
                    yTitle: 'elevation (meter)',
                    zTitle: '                                        latitude (degree)',
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
                        <td style={{textAlign: 'right', padding: '8pt 5pt 0pt 0pt', verticalAlign: 'bottom'}}>
                            <Title level={4}>
                                {this.state.product} Track {this.state.trackId}
                            </Title>
                        </td>
                        <td style={{textAlign: 'left', padding: '0pt 0pt 0pt 5pt'}}>
                            <Select defaultValue={this.state.dates[this.state.dates.length - 1]}
                                    key={this.state.dates[this.state.dates.length - 1]}
                                    style={{width: 150}}
                                    onChange={(val) => this.switchToIndex(this.state.dateIndex[val])}>
                                {
                                    this.state.dates.map((date, i) => (
                                        <Option key={i} value={i}>
                                            {date}
                                        </Option>
                                    ))
                                }
                            </Select>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{textAlign: 'center', width: '100%'}}>
                            <div style={{verticalAlign: 'top', textAlign: 'center', paddingBottom: '5pt', width: '100%'}}>
                                <table border={0} style={{textAlign: 'center', marginLeft: 'auto', marginRight: 'auto'}}>
                                    <tbody>
                                    <tr>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(249, 219, 86)',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                marginLeft: '35pt'
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt1l</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(176, 215, 104)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt1r</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(219, 143, 192)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt2l</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(145, 160, 200)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt2r</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(237, 146, 107)',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt3l</span>
                                        </td>
                                        <td>
                                            <span style={{
                                                height: '7px',
                                                width: '7px',
                                                backgroundColor: 'rgb(116, 178, 155)',
                                                borderRadius: '50%',
                                                display: 'inline-block'
                                            }}></span>
                                            <span style={{fontWeight: 'bold', padding: '0pt 10pt 0pt 5pt'}}>gt3r</span>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td colSpan={2}>
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
                        <td colSpan={2} style={{padding: '5pt 10pt 5pt 10pt'}}>
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

export default OpenAltimetryElevationProfile;
