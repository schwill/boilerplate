import $ from 'jquery';
import {date, hello} from './utilities';
import surprise from './modules/surprise';

hello('Schwill');

console.info(`The current date is ${date()}`);
console.info(`The current time is ${date('time')}`);
console.info(`The current date and time is ${date('full')}`);

$('.surprise').on('click', surprise);
