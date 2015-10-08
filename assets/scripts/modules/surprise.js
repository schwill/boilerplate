import $ from 'jquery';

export default function() {
  $('#surprise').remove();
  $('body').append(templates.surprise());
}
