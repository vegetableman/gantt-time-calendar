import {GanttTimeCalendar} from '../index.js'

var resource = {
    'resources': {
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
    'emptyslots': [
      '00:00-12:45',
      '14:15-16:00',
      '17:15-24:00'
    ]
};

var calendar = new GanttTimeCalendar(resource,
    {
        leftColTitle: 'Participants',
        target: document.getElementsByClassName('calendar')[0]
    }
);


window.onSearch = function(e) {
  var value = e.value;
  var resources = resource.resources;
  var newResource = {};
  for (var key in resources) {
      if(key.toLowerCase().indexOf(value.toLowerCase()) === 0) {
          newResource[key] = resources[key];
      }
  };
  calendar.update({'resources': newResource});
};