import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';
import main from 'main-loop';
import AttributeHook from 'virtual-dom/virtual-hyperscript/hooks/attribute-hook'

export class GanttTimeCalendar {

    constructor(state, {
        header = function() {return undefined;},
        target = document.body,
        startTime = 8,
        endTime = 20,
        interval = 30,
        colWidth = '80px',
        dividerWidth = '1px',
        leftColWidth = '25%',
        leftColTitle = '',
        rowHeight = '40px',
        rightColWidth = '75%'
    } = {}) {
        this.state = state;
        this.header = header;
        this.colWidth = colWidth;
        this.startTime = startTime;
        this.endTime = endTime;
        this.interval = interval;
        this.leftColWidth = leftColWidth;
        this.leftColTitle = leftColTitle;
        this.rowHeight = rowHeight;
        this.rightColWidth = rightColWidth;
        this.dividerWidth = dividerWidth;
        this.rightColScrollWidth = 0;

        this.render = this.render.bind(this);
        this.loop = main(this.state, this.render, {
            create: createElement,
            diff: diff,
            patch: patch
        });

        target.appendChild(this.loop.target);
    }

    renderHeader() {
        let ths = [];
        let cols = [];
        let colWidth = isNaN(+this.colWidth) ? +this.colWidth.split('px')[0] : this.colWidth;
        for (let i = this.startTime; i <= this.endTime; i++) {
            this.rightColScrollWidth += colWidth;
            cols.push(h('col', {style: {width: this.colWidth}}));
            ths.push(h('th.head', this.header(i), i));
        }

        return h(
            'table', [
                h('colgroup', cols),
                h('tbody', [
                    h('tr', ths)
                ])
            ]
        );
    }

    renderLeftColumn() {
        let trs = [];
        let resources = this.state.resources;
        for (let i in resources) {
            if (resources.hasOwnProperty(i)) {
                trs.push(h('tr.res-row', [
                    h('td', {style: {height: this.rowHeight}}, i)
                ]));
            }
        }
        return h(
            'table', [
                h('colgroup', [
                    h('col', {style: {width: this.leftColWidth}}),
                ]),
                trs
        ]);
    }

    renderRightColumn() {
        let bgTds = [];
        let cols = [];
        let colWidth = isNaN(+this.colWidth) ? +this.colWidth.split('px')[0] : this.colWidth;
        let startTime = this.startTime;
        let endTime = this.endTime;
        let mapTimeToPosition = {};
        let left = 0;

        for (let i = startTime; i <= endTime; i++) {
            for (let j = 0; j < 2; j++) {
                cols.push(h('col', {style: {width: colWidth/2}}));
                bgTds.push(h('td', {
                    class: new AttributeHook(null, (j === 1 ? 'minor': 'major'))
                }));
            }
            mapTimeToPosition[i + ':00'] = left;
            left += colWidth;
        }

        let trs = [];
        let resources = this.state.resources;
        for (let name in resources) {
            if (resources.hasOwnProperty(name)) {
                let events = [];
                if(resources[name].length) {
                    resources[name].forEach((r) => {
                        const startTime = r.start_time;
                        const endTime = r.end_time;
                        let startPosition = mapTimeToPosition[startTime];
                        let endPosition = mapTimeToPosition[endTime];

                        if(!startPosition) {
                            const hour = startTime.split(':')[0] + ':00';
                            const minute = +startTime.split(':')[1];
                            const tempStartPosition = mapTimeToPosition[hour];
                            startPosition = tempStartPosition + ((minute/60) * colWidth);
                        }

                        if (!endPosition) {
                            const hour = endTime.split(':')[0] + ':00';
                            const minute = +endTime.split(':')[1];
                            const tempEndPosition = mapTimeToPosition[hour];
                            endPosition = tempEndPosition + ((minute/60) * colWidth);
                        }

                        events.push(
                            h('a.conference', {style: {
                                left: startPosition + 'px',
                                width: (endPosition - startPosition) + 'px',
                                top: 0
                            }}, resources[name].conference)
                        );
                    });
                }

                trs.push(h('tr.row', [
                    h('td.row-content', {style: {height: this.rowHeight}}, [events])
                ]));
            }
        }

        return h('div.wrapper', {style: {
                position: 'relative'
            }}, [
            h('div.content', [
                h('table', [
                    h('tbody', trs)
                ])
            ]),
            h('div.bg', {
                    style: {
                        position: 'absolute',
                        'z-index': 1,
                        top: 0,
                        bottom: 0
                    }
                }, [
                h('table', {
                        style: {
                            height: '100%'
                        }
                    },[
                    h('colgroup', cols),
                    h('tbody', [
                        h('tr', bgTds)
                    ])
                ])
            ])
        ]);
    }

    attachHorizontalScroll(child, klass, hook, scrollFunc) {
        return h('div', {
            class: new AttributeHook(null, klass || ''),
            hook: hook,
            onscroll: scrollFunc,
            style: {
                'overflow-x': 'scroll'
            }},
            [
                h('div', {
                    style: {
                        'width': this.rightColScrollWidth + 'px'
                }}, [child])
            ]
        );
    }

    render() {
        let tableHeader = this.renderHeader.call(this);

        let HeaderHook = function(){};
        HeaderHook.prototype.hook = function(node, propertyName, previousValue) {
            this.headerScrollEl = node;
        }.bind(this);

        let BodyHook = function(){};
        BodyHook.prototype.hook = function(node, propertyName, previousValue) {
            this.bodyScrollEl = node;
        }.bind(this);

        return h(
            'table', [
                h('thead', [
                    h('tr', [
                        h('td.header.left-header', {style: {width: this.leftColWidth}}, this.leftColTitle),
                        h('td.divider', {style: {width: this.dividerWidth}}),
                        h('td.header.right-header', {style: {width: this.rightColWidth}}, [
                            this.attachHorizontalScroll(tableHeader, 'no-scroll', new HeaderHook(), function(e) {
                                this.bodyScrollEl.scrollLeft = e.target.scrollLeft;
                            }.bind(this))
                        ])
                    ])
                ]),
                h('tbody', [
                    h('tr', [
                        h('td', this.renderLeftColumn()),
                        h('td.divider', {style: {width: this.dividerWidth}}),
                        h('td', {style: {width: this.rightColWidth}}, [
                            this.attachHorizontalScroll(this.renderRightColumn(), null, new BodyHook(), function(e) {
                                this.headerScrollEl.scrollLeft = e.target.scrollLeft;
                            }.bind(this))
                        ])
                    ])
                ])
            ]
        );
    }
}