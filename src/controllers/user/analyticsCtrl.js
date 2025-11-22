
const statusCode = require('../../utilities/httpCode');
const response = require('../../utilities/httpResponse');
const { catchAsyncError } = require('../../middlewares/catchAsyncError');
const taskService = require('../../services/taskService');
const userService = require('../../services/userService');
const mongoose = require('mongoose');

module.exports = {
    getTaskAnalytics: catchAsyncError(async (req, res) => {
        let query = {};
        if (req.user.role === 'user') {
            query.$or = [
                { createdBy: req.user._id },
                { assignedTo: req.user._id }
            ];
        } else if (req.user.role === 'manager') {
            const teamMembers = await userService.fetchAllUsersByTeam(req.user.team);
            const memberIds = teamMembers.map(m => new mongoose.Types.ObjectId(m._id));
            query.$or = [
                { createdBy: { $in: memberIds } },
                { assignedTo: { $in: memberIds } }
            ];
        }
        const tasks = await taskService.findAllTasks(query);
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const cancelled = tasks.filter(t => t.status === 'cancelled').length;

        const now = new Date();
        const overdue = tasks.filter(t => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < now;
            const isNotCompleted = t.status !== 'completed' && t.status !== 'cancelled';
            return isOverdue && isNotCompleted;
        }).length;

        const byPriority = {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            urgent: tasks.filter(t => t.priority === 'urgent').length
        };

        const completionRate = total > 0 
            ? ((completed / total) * 100).toFixed(2) 
            : 0;

        const analytics = {
            total,
            completed,
            pending,
            inProgress,
            cancelled,
            overdue,
            byPriority,
            completionRate: parseFloat(completionRate),
            summary: {
                active: pending + inProgress,
                completed: completed,
                overdue: overdue
            }
        };

        response.responseHandlerWithData(
            res,
            true,
            statusCode.OK,
            'Task analytics fetched successfully',
            analytics 
        );
    }),

    getUserStatistics: catchAsyncError(async (req, res) => {
        const { userId } = req.query;
        const targetUserId = userId || req.user._id.toString();
        if (req.user.role === 'user') {
            if (targetUserId !== req.user._id.toString()) {
                return response.responseHandlerWithError(
                    res,
                    false,
                    statusCode.FORBIDDEN,
                    'You can only view your own statistics'
                );
            }
        } else if (req.user.role === 'manager') {
            if (userId) {
                const user = await userService.fetchUser({ _id: new mongoose.Types.ObjectId(userId) });
                if (!user || user.team?.toString() !== req.user.team?.toString()) {
                    return response.responseHandlerWithError(
                        res,
                        false,
                        statusCode.FORBIDDEN,
                        'You can only view statistics of your team members'
                    );
                }
            }
        }

        const user = await userService.fetchUser({ _id: new mongoose.Types.ObjectId(targetUserId) });
        if (!user) {
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.RESULTNOTFOUND,
                'User not found'
            );
        }
        const createdTasks = await taskService.findAllTasks({ createdBy: new mongoose.Types.ObjectId(targetUserId) });
        
        const assignedTasks = await taskService.findAllTasks({ assignedTo: new mongoose.Types.ObjectId(targetUserId) });

        const statistics = {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            tasksCreated: createdTasks.length,
            tasksAssigned: assignedTasks.length,
            tasksCompleted: assignedTasks.filter(t => t.status === 'completed').length,
            tasksPending: assignedTasks.filter(t => t.status === 'pending').length,
            tasksInProgress: assignedTasks.filter(t => t.status === 'in-progress').length,
            tasksOverdue: assignedTasks.filter(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                const isNotCompleted = t.status !== 'completed' && t.status !== 'cancelled';
                return isOverdue && isNotCompleted;
            }).length,
            completionRate: assignedTasks.length > 0 
                ? ((assignedTasks.filter(t => t.status === 'completed').length / assignedTasks.length) * 100).toFixed(2)
                : 0,
            byPriority: {
                low: assignedTasks.filter(t => t.priority === 'low').length,
                medium: assignedTasks.filter(t => t.priority === 'medium').length,
                high: assignedTasks.filter(t => t.priority === 'high').length,
                urgent: assignedTasks.filter(t => t.priority === 'urgent').length
            }
        };

        response.responseHandlerWithData(
            res,
            true,
            statusCode.OK,
            'User statistics fetched successfully',
             statistics 
        );
    }),
    getTeamStatistics: catchAsyncError(async (req, res) => {
        if (req.user.role === 'user') {
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.FORBIDDEN,
                'Access denied. Only managers and admins can view team statistics'
            );
        }

        const { teamId } = req.query;
        let targetTeamId = teamId || req.user.team?.toString();

        if (req.user.role === 'manager') {
            if (teamId && teamId !== req.user.team?.toString()) {
                return response.responseHandlerWithError(
                    res,
                    false,
                    statusCode.FORBIDDEN,
                    'You can only view statistics of your own team'
                );
            }
        }

        if (!targetTeamId) {
            return response.responseHandlerWithError(
                res,
                false,
                statusCode.BAD_REQUEST,
                'Team ID is required'
            );
        }

    
        const teamMembers = await userService.fetchAllUsersByTeam(targetTeamId);
        const memberIds = teamMembers.map(m => new mongoose.Types.ObjectId(m._id));

        const teamTasks = await taskService.findAllTasks({
            $or: [
                { createdBy: { $in: memberIds } },
                { assignedTo: { $in: memberIds } }
            ]
        });

        const total = teamTasks.length;
        const completed = teamTasks.filter(t => t.status === 'completed').length;
        const pending = teamTasks.filter(t => t.status === 'pending').length;
        const inProgress = teamTasks.filter(t => t.status === 'in-progress').length;
        const overdue = teamTasks.filter(t => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
            const isNotCompleted = t.status !== 'completed' && t.status !== 'cancelled';
            return isOverdue && isNotCompleted;
        }).length;

        const byMember = teamMembers.map(member => {
            const memberTasks = teamTasks.filter(t => 
                t.createdBy?.toString() === member._id.toString() || 
                t.assignedTo?.toString() === member._id.toString()
            );
            const memberAssignedTasks = teamTasks.filter(t => 
                t.assignedTo?.toString() === member._id.toString()
            );

            return {
                userId: member._id,
                username: member.username,
                email: member.email,
                tasksCreated: memberTasks.filter(t => t.createdBy?.toString() === member._id.toString()).length,
                tasksAssigned: memberAssignedTasks.length,
                tasksCompleted: memberAssignedTasks.filter(t => t.status === 'completed').length,
                tasksPending: memberAssignedTasks.filter(t => t.status === 'pending').length,
                tasksOverdue: memberAssignedTasks.filter(t => {
                    const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                    const isNotCompleted = t.status !== 'completed' && t.status !== 'cancelled';
                    return isOverdue && isNotCompleted;
                }).length,
                completionRate: memberAssignedTasks.length > 0
                    ? ((memberAssignedTasks.filter(t => t.status === 'completed').length / memberAssignedTasks.length) * 100).toFixed(2)
                    : 0
            };
        });

        const teamStatistics = {
            teamId: targetTeamId,
            totalMembers: teamMembers.length,
            totalTasks: total,
            completed,
            pending,
            inProgress,
            overdue,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
            byPriority: {
                low: teamTasks.filter(t => t.priority === 'low').length,
                medium: teamTasks.filter(t => t.priority === 'medium').length,
                high: teamTasks.filter(t => t.priority === 'high').length,
                urgent: teamTasks.filter(t => t.priority === 'urgent').length
            },
            byMember
        };

        response.responseHandlerWithData(
            res,
            true,
            statusCode.OK,
            'Team statistics fetched successfully',
            teamStatistics 
        );
    })
};



