import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Project } from "@bratCode/zod";

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
}

const initialState: ProjectState = {
    projects: [],
    currentProject: null,
};

const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setProjects: (state, action: PayloadAction<Project[]>) => {
            state.projects = action.payload;
        },
        setCurrentProject: (state, action: PayloadAction<Project | null>) => {
            state.currentProject = action.payload;
        },
        addNewProject: (state, action: PayloadAction<Project>) => {
            state.projects.unshift(action.payload);
        },
        starProject: (state, action: PayloadAction<string>) => {
            const project = state.projects.find(
                (project) => project._id === action.payload,
            );
            if (project) {
                project.starred = !project.starred;
            }
        },
        setDeleteProject: (state, action: PayloadAction<string>) => {
            state.projects = state.projects.filter(
                (project) => project._id !== action.payload,
            );
        },
    },
});

export const { setProjects, setCurrentProject, addNewProject, starProject, setDeleteProject } =
    projectSlice.actions;

export default projectSlice.reducer;
