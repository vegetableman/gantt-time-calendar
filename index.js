import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';
import main from 'main-loop';
import AttributeHook from 'virtual-dom/virtual-hyperscript/hooks/attribute-hook'
import uid from 'uid';

export class GanttTimeCalendar {

    constructor(state, {
        header = function() {return undefined;},
        target = document.body,
        startTime = 8,
        endTime = 20,
        interval = 30,
        colWidth = 80,
        dividerWidth = '1px',
        leftColWidth = '25%',
        leftColTitle = '',
        rowHeight = '40px',
        rightColWidth = '75%',
        emptySlots = [],
        selectedSlots = [],
        onSelect = function(){}
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
        this.onSelect = onSelect;
        this.emptySlots = this.spreadSlots(emptySlots);

        this.render = this.render.bind(this);
        this.loop = main(this.state, this.render, {
            create: createElement,
            diff: diff,
            patch: patch
        });

        target.appendChild(this.loop.target);
    }

    update(state) {
        this.state = state;
        this.rightColScrollWidth = 0;
        this.loop.update(state);
    }

    select(slot) {
        let times = slot.split('-');
        let startTime = times[0];
        let endTime = times[1];
        for (let slot of this.emptySlots) {
            console.log(slot);
            if (slot['startTime'] === startTime && slot['endTime'] === endTime) {
                document.querySelectorAll('td.selected').forEach((node) => {
                    node.classList.remove('selected');
                });
                var nodes = document.querySelectorAll(`[data-empty-id="${slot['id']}"]`);
                nodes.forEach((node) => {
                    node.classList.add('selected');
                });
                break;
            }
        }
    }

    renderHeader() {
        let ths = [];
        let cols = [];
        let colWidth = this.colWidth;
        for (let i = this.startTime; i <= this.endTime; i++) {
            this.rightColScrollWidth += colWidth;
            cols.push(h('col', {style: {width: colWidth + 'px'}}));
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
        let resources = this.state;
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

    findPosition(time, timeToPositionMap) {
        if (timeToPositionMap[time]) {
            return timeToPositionMap[time];
        }
        const hour = time.split(':')[0] + ':00';
        const minute = parseInt(time.split(':')[1]);
        const tempPosition = timeToPositionMap[hour];
        return tempPosition ? (tempPosition + ((minute/60) * this.colWidth)) : undefined;
    }

    spreadSlots(slots) {
        return slots.map(function(slot) {
            var times = slot.split('-');
            return {
                id: uid(),
                startTime: times[0],
                endTime: times[1]
            };
        });
    }

    getEmptySlot(id) {
        for (let slot of this.emptySlots) {
            if (slot['id'] === id) {
                return slot;
                break;
            }
        }
    }

    matchEmptySlot(time, type) {
        for (let slot of this.emptySlots) {
            if (slot[type] === time) {
                return slot['id'];
                break;
            }
        }
        return false;
    }

    renderRightColumn() {
        let bgTds = [];
        let cols = [];
        let colWidth = this.colWidth;
        let startTime = this.startTime;
        let endTime = this.endTime;
        let timeToPositionMap = {};
        let left = 0;
        let emptySlots = this.emptySlots;
        let emptySlotStart = false;
        let self = this;

        for (let i = startTime; i <= endTime; i++) {
            let minutes = 0;
            for (let j = 0; j < 4; j++) {
                const time = `${i}:${j === 0 ? '00' : minutes}`;
                minutes += 15;

                let matchId;
                if (!emptySlotStart && (matchId = this.matchEmptySlot(time, 'startTime'))) {
                    emptySlotStart = matchId;
                }
                else if (emptySlotStart && this.matchEmptySlot(time, 'endTime')) {
                    emptySlotStart = false;
                }

                let emptyMarker = {}
                if (emptySlotStart) {
                    class EmptyNodeHook {
                        hook(node, propertyName, previousValue) {
                            node.addEventListener('mouseover', (e) => {
                                var nodes = document.querySelectorAll(`[data-empty-id="${e.target.dataset.emptyId}"]`);
                                nodes.forEach((node) => {
                                    if (!node.classList.contains('hover'))
                                        node.classList.add('hover');
                                });
                            });
                            node.addEventListener('mouseleave', (e) => {
                                var nodes = document.querySelectorAll(`[data-empty-id="${e.target.dataset.emptyId}"]`);
                                nodes.forEach((node) => {
                                    node.classList.remove('hover');
                                });
                            });
                            node.addEventListener('click', (e) => {
                                document.querySelectorAll('td.selected').forEach((node) => {
                                    node.classList.remove('selected');
                                });
                                var emptySlotId = e.target.dataset.emptyId;
                                var nodes = document.querySelectorAll(`[data-empty-id="${emptySlotId}"]`);
                                nodes.forEach((node) => {
                                    node.classList.add('selected');
                                });
                                self.onSelect(self.getEmptySlot(emptySlotId));
                            });
                        }
                    }

                    emptyMarker = {
                        'data-empty-id': new AttributeHook(null, emptySlotStart),
                        'hook': new EmptyNodeHook()
                    };
                }

                let klass = '';
                if (j === 2) {
                    klass += 'minor';
                }
                else if (j === 0) {
                    klass += 'major';
                }
                else {
                    klass += 'quarter';
                }
                klass += (emptySlotStart ? ' empty': '');

                cols.push(h('col', {style: {width: colWidth/4}}));
                bgTds.push(h('td', Object.assign({
                    'class': new AttributeHook(null, klass),
                    'data-time': new AttributeHook(null, time)
                }, emptyMarker)));
            }
            timeToPositionMap[i + ':00'] = left;
            left += colWidth;
        }

        let trs = [];
        let resources = this.state;
        for (let name in resources) {
            if (resources.hasOwnProperty(name)) {
                let events = [];
                if(resources[name].length) {
                    resources[name].forEach((r) => {
                        const startTime = r.start_time;
                        const endTime = r.end_time;
                        let startPosition = this.findPosition(startTime, timeToPositionMap);
                        let endPosition = this.findPosition(endTime, timeToPositionMap);

                        events.push(
                            h('a.conference', {style: {
                                left: startPosition + 'px',
                                width: (endPosition - startPosition) + 'px',
                                top: 0
                            }}, r.conference_name)
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
        let self = this;

        class HeaderHook {
            hook(node, propertyName, previousValue) {
                self.headerScrollEl = node;
            }
        }

        class BodyHook {
            hook(node, propertyName, previousValue) {
                self.bodyScrollEl = node;
            }
        }

        return h(
            'table', [
                h('thead', [
                    h('tr', [
                        h('td.header.left-header', {style: {width: this.leftColWidth}}, this.leftColTitle),
                        h('td.divider', {style: {width: this.dividerWidth}}),
                        h('td.header.right-header', {style: {width: this.rightColWidth}}, [
                            this.attachHorizontalScroll(tableHeader, 'no-scroll', new HeaderHook(), (e) => {
                                this.bodyScrollEl.scrollLeft = e.target.scrollLeft;
                            })
                        ])
                    ])
                ]),
                h('tbody', [
                    h('tr', [
                        h('td', this.renderLeftColumn()),
                        h('td.divider', {style: {width: this.dividerWidth}}),
                        h('td', {style: {width: this.rightColWidth}}, [
                            this.attachHorizontalScroll(this.renderRightColumn(), null, new BodyHook(), (e) => {
                                this.headerScrollEl.scrollLeft = e.target.scrollLeft;
                            })
                        ])
                    ])
                ])
            ]
        );
    }
}

window.GanttTimeCalendar = GanttTimeCalendar;