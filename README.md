# gantt-time-calendar

![Current](https://raw.githubusercontent.com/vegetableman/gantt-time-calendar/master/current.png)

**Example**

```js
new GanttTimeCalendar({
        resources: {
            'Wimpy': [
              {
                'conference_name': 'tref',
                'start_time': '13:00',
                'end_time': '14:00'
              },
              {
                'conference_name': 'ugh fy',
                'start_time': '16:07',
                'end_time': '17:07'
              }
            ],
            'Mush': [
              {
                'conference_name': 'tref',
                'start_time': '13:00',
                'end_time': '14:00'
              }
            ],
            'Meh': []
        },
        emptyslots: [
          '00:00-12:45',
          '14:15-16:00',
          '17:15-24:00'
        ]
    },
    {
        leftColTitle: 'Participants',
        target: document.getElementsByClassName('calendar')[0]
    }
);
```
