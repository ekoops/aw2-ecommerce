import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({"message": "GET on /orders"})
});

router.post("/", (req, res) => {
  res.json({"message": "POST on /orders"})
});

router.put("/", (req, res) => {
  res.json({"message": "PUT on /orders"})
});

router.patch("/", (req, res) => {
  res.json({"message": "PATCH on /orders"})
});

router.delete("/", (req, res) => {
  res.json({"message": "DELETE on /orders"})
});

export = router;