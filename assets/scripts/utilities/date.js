export default function(format = 'date') {
  let date = new Date();
  let formats = {
    full: 'toLocaleString',
    date: 'toLocaleDateString',
    time: 'toLocaleTimeString'
  };

  return date[formats[format]]();
}
