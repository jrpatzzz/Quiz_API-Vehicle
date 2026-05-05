const express = require('express')
const router = express.Router()

// Home page (static info about the app using OpenTDB)
router.get('/', (req, res) => {
  res.render('index', { title: 'Home - Express Quiz App' })
})

// About page (info about Express.js application)
router.get('/about', (req, res) => {
  res.render('about', { title: 'About - Express Quiz App' })
})

// Default route: redirect to home page
router.get('/quiz', (req, res) => {
  res.render('quiz', { title: 'Quiz - Express Quiz App' })
})

// Default route: redirect to home page
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact - Express Quiz App' })
})

// Default route: redirect to home page
router.get('/vehicletype', (req, res) => {
  res.render('vehicletype', { title: 'Vehicle Type - Express Quiz App' })
})

module.exports = router
