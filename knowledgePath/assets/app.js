// src/application.js
import { Application } from "stimulus"
import { definitionsFromContext } from "stimulus/webpack-helpers"
import "./site.scss";
import 'bootstrap';
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

const application = Application.start();
//const context = require.context("./controllers", true, /\.js$/);
application.load(definitionsFromContext(context));
const trix = require('trix');
