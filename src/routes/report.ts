const express = require('express');
const router = express.Router();
import auth from '../middleware/auth';
import reportMap from '../models/report';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');

router.get('/report', (req: Request, res: Response) => {
  res.render('report');
});

router.post('/report', auth, async (req: Request, res: Response) => {
  try {
    const link = req.body.txtLink;
    const email = req.body.txtEmail;
    const desc = req.body.txtDescription;
    const description = `email: ${email}, \ndesc: ${desc}`;
    const report = new reportMap({
      link: link,
      description: description,
    });
    await report.save().catch((err: Error) => {
      res.send(err.message);
    });
    res.status(200).send('Successfully submitted');
  } catch (err) {
    console.log('Error:  ' + err);
  }
});

router.get('/view_reports', auth, async (req: Request, res: Response) => {
  const reports = await reportMap.find({resolved: false});
  const resolved_reports = await reportMap.find({resolved: true});
  console.log('reports: ' + reports);
  console.log('resolved_reports: ' + resolved_reports);
  res.render('view_reports', {
    reports: reports,
    resolved_reports: resolved_reports,
  });
});

module.exports = router;
