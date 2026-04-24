const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const screenAuth = require('../middlewares/screenAuth');

router.get('/', authenticate, assignmentController.getAll);
router.get('/me', screenAuth, (req, res, next) => {
  req.query.screenId = req.screen._id;
  req.query.groupId = req.screen.groupId;
  assignmentController.getActive(req, res, next);
});
router.get('/active', assignmentController.getActive);
router.post('/', authenticate, authorize('admin'), assignmentController.create);
router.delete('/:id', authenticate, authorize('admin'), assignmentController.delete);

module.exports = router;
