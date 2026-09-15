import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { me } from "./features/me.ts";
import { setUserData } from "./redux/userSlice.ts";
import ProjectPage from "./pages/ProjectPage.tsx";
import Plan from "./pages/Plan.tsx";

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await me();
                dispatch(setUserData(data));
            } catch (err) {
                console.error(err);
                dispatch(setUserData(null));
            }
        };
        fetch();
    }, []);
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/project/:id" element={<ProjectPage />} />
                <Route path="/plan" element={<Plan />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
