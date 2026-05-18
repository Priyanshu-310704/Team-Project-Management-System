const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json(task);
});

router.get("/:projectId", async (req, res) => {
  const tasks = await Task.find({ project: req.params.projectId });
  res.json(tasks);
});

router.put("/:id", async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  res.json(task);
});

router.delete("/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Task deleted" });
});

module.exports = router;