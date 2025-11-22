const express = require('express');
const router = express.Router();
const { signUp, login, logout, userProfile, updateUserProfile, getAllUsers, deleteUser } = require('../../controllers/user/userAuth');
const { authUser } = require('../../middlewares/authHandler');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const { createTask, getTasks, updateTask, deleteTask } = require('../../controllers/user/taskCtrl');
const { assignTask, getAssignedTasks, uupdateAssignment } = require('../../controllers/user/assignmentCtrl');
const { getTaskAnalytics, getUserStatistics, getTeamStatistics } = require('../../controllers/user/analyticsCtrl');
const { createTeam } = require('../../controllers/user/teamCtrl');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: john_doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123!
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *           example: Complete API Documentation
 *         description:
 *           type: string
 *           example: Write comprehensive API documentation
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: 2024-12-31T23:59:59Z
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: high
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *           example: pending
 *         assignedTo:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 */

/**
 * @swagger
 * /api/v1/user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             username: john_doe
 *             email: john@example.com
 *             password: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 */
router.post("/signup", signUp);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *           example:
 *             email: john@example.com
 *             password: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

router.use(authUser);

/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/v1/user/user-profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get("/user-profile", userProfile);

/**
 * @swagger
 * /api/v1/user/update-user-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe_updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.updated@example.com
 *           example:
 *             username: john_doe_updated
 *             email: john.updated@example.com
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/update-user-profile", updateUserProfile);

/**
 * @swagger
 * /api/v1/user/delete-user:
 *   put:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *           example:
 *             userId: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.put("/delete-user", authorizeRoles("admin"), deleteUser);

/**
 * @swagger
 * /api/v1/user/get-all-users:
 *   get:
 *     summary: Get all users (Admin/Manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get("/get-all-users", authorizeRoles("admin", "manager"), getAllUsers);

// task routes

/**
 * @swagger
 * /api/v1/user/create-task:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *           example:
 *             title: Complete API Documentation
 *             description: Write comprehensive API documentation
 *             dueDate: 2024-12-31T23:59:59Z
 *             priority: high
 *             status: pending
 *             assignedTo: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post("/create-task", createTask);

/**
 * @swagger
 * /api/v1/user/get-tasks:
 *   get:
 *     summary: Get all tasks with filtering and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by task priority
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get("/get-tasks", getTasks);

/**
 * @swagger
 * /api/v1/user/update-task:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               title:
 *                 type: string
 *                 example: Updated Task Title
 *               description:
 *                 type: string
 *                 example: Updated task description
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *                 example: in-progress
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *           example:
 *             taskId: 507f1f77bcf86cd799439011
 *             title: Updated Task Title
 *             description: Updated task description
 *             status: in-progress
 *             priority: medium
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put("/update-task", updateTask);

/**
 * @swagger
 * /api/v1/user/delete-task:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete("/delete-task", deleteTask);

/**
 * @swagger
 * /api/v1/user/assign-task:
 *   post:
 *     summary: Assign a task to a user
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - assignedTo
 *             properties:
 *               taskId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               assignedTo:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *           example:
 *             taskId: 507f1f77bcf86cd799439011
 *             assignedTo: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Task assigned successfully
 */
router.post("/assign-task", authorizeRoles("admin", "manager", "user"), assignTask);

/**
 * @swagger
 * /api/v1/user/update-assignment:
 *   put:
 *     summary: Update task assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignmentId
 *             properties:
 *               assignmentId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               assignedTo:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *           example:
 *             assignmentId: 507f1f77bcf86cd799439011
 *             assignedTo: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 */
router.put("/update-assignment", authorizeRoles("admin", "manager", "user"), uupdateAssignment);

/**
 * @swagger
 * /api/v1/user/get-assigned-tasks:
 *   get:
 *     summary: Get assigned tasks
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Assigned tasks retrieved successfully
 */
router.get("/get-assigned-tasks", getAssignedTasks);

/**
 * @swagger
 * /api/v1/user/get-task-analytics:
 *   get:
 *     summary: Get task analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get("/get-task-analytics", getTaskAnalytics);

/**
 * @swagger
 * /api/v1/user/get-user-statistics:
 *   get:
 *     summary: Get user statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for statistics
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get("/get-user-statistics", getUserStatistics);

/**
 * @swagger
 * /api/v1/user/get-team-statistics:
 *   get:
 *     summary: Get team statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Team ID for statistics
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Team statistics retrieved successfully
 */
router.get("/get-team-statistics", getTeamStatistics);


// team routes

/**
 * @swagger
 * /api/v1/user/create-team:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - managerId
 *               - membersIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: Team 1
 *               managerId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               membersIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [507f1f77bcf86cd799439012, 507f1f77bcf86cd799439013]
 *           example:
 *             name: Team 1
 *             managerId: 507f1f77bcf86cd799439011
 *             membersIds: [507f1f77bcf86cd799439012, 507f1f77bcf86cd799439013]
 *     responses:
 *       201:
 *         description: Team created successfully
 */
router.post("/create-team", authorizeRoles("admin", "manager"), createTeam);

module.exports = router;