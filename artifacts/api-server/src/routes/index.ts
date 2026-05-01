import { Router, type IRouter } from "express";
import healthRouter from "./health";
import seasonsRouter from "./seasons";
import marketsRouter from "./markets";
import departmentsRouter from "./departments";
import suppliersRouter from "./suppliers";
import storageLocationsRouter from "./storage_locations";
import itemsRouter from "./items";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/seasons", seasonsRouter);
router.use("/markets", marketsRouter);
router.use("/departments", departmentsRouter);
router.use("/suppliers", suppliersRouter);
router.use("/storage-locations", storageLocationsRouter);
router.use("/items", itemsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);

export default router;
