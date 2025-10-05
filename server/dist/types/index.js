"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacePermission = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["OWNER"] = "owner";
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var WorkspacePermission;
(function (WorkspacePermission) {
    WorkspacePermission["VIEW_TRANSACTIONS"] = "view_transactions";
    WorkspacePermission["CREATE_TRANSACTIONS"] = "create_transactions";
    WorkspacePermission["EDIT_TRANSACTIONS"] = "edit_transactions";
    WorkspacePermission["DELETE_TRANSACTIONS"] = "delete_transactions";
    WorkspacePermission["MANAGE_BUDGETS"] = "manage_budgets";
    WorkspacePermission["MANAGE_GOALS"] = "manage_goals";
    WorkspacePermission["VIEW_REPORTS"] = "view_reports";
    WorkspacePermission["MANAGE_MEMBERS"] = "manage_members";
    WorkspacePermission["MANAGE_WORKSPACE"] = "manage_workspace";
})(WorkspacePermission || (exports.WorkspacePermission = WorkspacePermission = {}));
