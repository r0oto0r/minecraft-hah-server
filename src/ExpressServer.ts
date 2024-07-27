import express, { Application } from "express";
import { Log } from './Log';
import cors from 'cors';

export class ExpressServer {
	static getApp() {
		throw new Error('Method not implemented.');
	}
	private static app: Application;

	public static init() {
		Log.info("Initializing Express Server");

		this.app = express();
		this.app.use(cors());
		this.app.use(express.json({ limit: '50mb' }));
		this.app.use(express.urlencoded({ extended: true }));

		return this.app;
	}
}
