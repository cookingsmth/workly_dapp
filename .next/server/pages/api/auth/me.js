"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/auth/me";
exports.ids = ["pages/api/auth/me"];
exports.modules = {

/***/ "jsonwebtoken":
/*!*******************************!*\
  !*** external "jsonwebtoken" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "(api)/./pages/api/auth/me.ts":
/*!******************************!*\
  !*** ./pages/api/auth/me.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jsonwebtoken */ \"jsonwebtoken\");\n/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);\n// pages/api/auth/me.ts\n\n// Простая версия без middleware для начала\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst path = __webpack_require__(/*! path */ \"path\");\nconst getUsersFilePath = ()=>path.join(process.cwd(), \"data\", \"users.json\");\nconst loadUsers = ()=>{\n    const filePath = getUsersFilePath();\n    if (!fs.existsSync(filePath)) {\n        return [];\n    }\n    try {\n        const data = fs.readFileSync(filePath, \"utf8\");\n        return JSON.parse(data);\n    } catch (error) {\n        console.error(\"Error loading users:\", error);\n        return [];\n    }\n};\nasync function handler(req, res) {\n    if (req.method !== \"GET\") {\n        return res.status(405).json({\n            error: \"Method not allowed\"\n        });\n    }\n    try {\n        // Получаем токен из заголовка\n        const authHeader = req.headers.authorization;\n        if (!authHeader || !authHeader.startsWith(\"Bearer \")) {\n            return res.status(401).json({\n                error: \"Unauthorized\",\n                message: \"No valid authorization token provided\"\n            });\n        }\n        const token = authHeader.split(\" \")[1];\n        // Проверяем токен\n        let decoded;\n        try {\n            decoded = jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default().verify(token, process.env.JWT_SECRET || \"workly-local-secret-key-2025\");\n        } catch (error) {\n            return res.status(401).json({\n                error: \"Unauthorized\",\n                message: \"Invalid or expired token\"\n            });\n        }\n        // Загружаем пользователей\n        const users = loadUsers();\n        const user = users.find((u)=>u.id === decoded.userId);\n        if (!user) {\n            return res.status(401).json({\n                error: \"Unauthorized\",\n                message: \"User not found\"\n            });\n        }\n        // Возвращаем пользователя без пароля\n        const userResponse = {\n            id: user.id,\n            username: user.username,\n            email: user.email,\n            walletAddress: user.walletAddress,\n            createdAt: user.createdAt,\n            isEmailVerified: user.isEmailVerified || false,\n            profile: user.profile || {\n                bio: \"\",\n                avatar: null,\n                skills: [],\n                completedTasks: 0,\n                rating: 0,\n                totalEarned: 0\n            }\n        };\n        res.status(200).json({\n            success: true,\n            user: userResponse\n        });\n    } catch (error) {\n        console.error(\"Get user error:\", error);\n        res.status(500).json({\n            error: \"Internal server error\",\n            message: \"Failed to get user data\"\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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L21lLnRzPzAyODMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gcGFnZXMvYXBpL2F1dGgvbWUudHNcclxuaW1wb3J0IHsgTmV4dEFwaVJlcXVlc3QsIE5leHRBcGlSZXNwb25zZSB9IGZyb20gJ25leHQnXHJcbmltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJ1xyXG5cclxuLy8g0J/RgNC+0YHRgtCw0Y8g0LLQtdGA0YHQuNGPINCx0LXQtyBtaWRkbGV3YXJlINC00LvRjyDQvdCw0YfQsNC70LBcclxuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpXHJcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcclxuXHJcbmNvbnN0IGdldFVzZXJzRmlsZVBhdGggPSAoKSA9PiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2RhdGEnLCAndXNlcnMuanNvbicpXHJcblxyXG5jb25zdCBsb2FkVXNlcnMgPSAoKSA9PiB7XHJcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRVc2Vyc0ZpbGVQYXRoKClcclxuICBcclxuICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XHJcbiAgICByZXR1cm4gW11cclxuICB9XHJcbiAgXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4JylcclxuICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgdXNlcnM6JywgZXJyb3IpXHJcbiAgICByZXR1cm4gW11cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxOiBOZXh0QXBpUmVxdWVzdCwgcmVzOiBOZXh0QXBpUmVzcG9uc2UpIHtcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gJ0dFVCcpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwNSkuanNvbih7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KVxyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vINCf0L7Qu9GD0YfQsNC10Lwg0YLQvtC60LXQvSDQuNC3INC30LDQs9C+0LvQvtCy0LrQsFxyXG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb25cclxuICAgIFxyXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xyXG4gICAgICAgIGVycm9yOiAnVW5hdXRob3JpemVkJyxcclxuICAgICAgICBtZXNzYWdlOiAnTm8gdmFsaWQgYXV0aG9yaXphdGlvbiB0b2tlbiBwcm92aWRlZCdcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3BsaXQoJyAnKVsxXVxyXG4gICAgXHJcbiAgICAvLyDQn9GA0L7QstC10YDRj9C10Lwg0YLQvtC60LXQvVxyXG4gICAgbGV0IGRlY29kZWRcclxuICAgIHRyeSB7XHJcbiAgICAgIGRlY29kZWQgPSBqd3QudmVyaWZ5KFxyXG4gICAgICAgIHRva2VuLCBcclxuICAgICAgICBwcm9jZXNzLmVudi5KV1RfU0VDUkVUIHx8ICd3b3JrbHktbG9jYWwtc2VjcmV0LWtleS0yMDI1J1xyXG4gICAgICApIGFzIHsgdXNlcklkOiBzdHJpbmcgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogJ1VuYXV0aG9yaXplZCcsXHJcbiAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgb3IgZXhwaXJlZCB0b2tlbidcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvLyDQl9Cw0LPRgNGD0LbQsNC10Lwg0L/QvtC70YzQt9C+0LLQsNGC0LXQu9C10LlcclxuICAgIGNvbnN0IHVzZXJzID0gbG9hZFVzZXJzKClcclxuICAgIGNvbnN0IHVzZXIgPSB1c2Vycy5maW5kKCh1OiBhbnkpID0+IHUuaWQgPT09IGRlY29kZWQudXNlcklkKVxyXG4gICAgXHJcbiAgICBpZiAoIXVzZXIpIHtcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcclxuICAgICAgICBlcnJvcjogJ1VuYXV0aG9yaXplZCcsXHJcbiAgICAgICAgbWVzc2FnZTogJ1VzZXIgbm90IGZvdW5kJ1xyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vINCS0L7Qt9Cy0YDQsNGJ0LDQtdC8INC/0L7Qu9GM0LfQvtCy0LDRgtC10LvRjyDQsdC10Lcg0L/QsNGA0L7Qu9GPXHJcbiAgICBjb25zdCB1c2VyUmVzcG9uc2UgPSB7XHJcbiAgICAgIGlkOiB1c2VyLmlkLFxyXG4gICAgICB1c2VybmFtZTogdXNlci51c2VybmFtZSxcclxuICAgICAgZW1haWw6IHVzZXIuZW1haWwsXHJcbiAgICAgIHdhbGxldEFkZHJlc3M6IHVzZXIud2FsbGV0QWRkcmVzcyxcclxuICAgICAgY3JlYXRlZEF0OiB1c2VyLmNyZWF0ZWRBdCxcclxuICAgICAgaXNFbWFpbFZlcmlmaWVkOiB1c2VyLmlzRW1haWxWZXJpZmllZCB8fCBmYWxzZSxcclxuICAgICAgcHJvZmlsZTogdXNlci5wcm9maWxlIHx8IHtcclxuICAgICAgICBiaW86ICcnLFxyXG4gICAgICAgIGF2YXRhcjogbnVsbCxcclxuICAgICAgICBza2lsbHM6IFtdLFxyXG4gICAgICAgIGNvbXBsZXRlZFRhc2tzOiAwLFxyXG4gICAgICAgIHJhdGluZzogMCxcclxuICAgICAgICB0b3RhbEVhcm5lZDogMFxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICB1c2VyOiB1c2VyUmVzcG9uc2VcclxuICAgIH0pXHJcblxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgdXNlciBlcnJvcjonLCBlcnJvcilcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdldCB1c2VyIGRhdGEnXHJcbiAgICB9KVxyXG4gIH1cclxufSJdLCJuYW1lcyI6WyJqd3QiLCJmcyIsInJlcXVpcmUiLCJwYXRoIiwiZ2V0VXNlcnNGaWxlUGF0aCIsImpvaW4iLCJwcm9jZXNzIiwiY3dkIiwibG9hZFVzZXJzIiwiZmlsZVBhdGgiLCJleGlzdHNTeW5jIiwiZGF0YSIsInJlYWRGaWxlU3luYyIsIkpTT04iLCJwYXJzZSIsImVycm9yIiwiY29uc29sZSIsImhhbmRsZXIiLCJyZXEiLCJyZXMiLCJtZXRob2QiLCJzdGF0dXMiLCJqc29uIiwiYXV0aEhlYWRlciIsImhlYWRlcnMiLCJhdXRob3JpemF0aW9uIiwic3RhcnRzV2l0aCIsIm1lc3NhZ2UiLCJ0b2tlbiIsInNwbGl0IiwiZGVjb2RlZCIsInZlcmlmeSIsImVudiIsIkpXVF9TRUNSRVQiLCJ1c2VycyIsInVzZXIiLCJmaW5kIiwidSIsImlkIiwidXNlcklkIiwidXNlclJlc3BvbnNlIiwidXNlcm5hbWUiLCJlbWFpbCIsIndhbGxldEFkZHJlc3MiLCJjcmVhdGVkQXQiLCJpc0VtYWlsVmVyaWZpZWQiLCJwcm9maWxlIiwiYmlvIiwiYXZhdGFyIiwic2tpbGxzIiwiY29tcGxldGVkVGFza3MiLCJyYXRpbmciLCJ0b3RhbEVhcm5lZCIsInN1Y2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(api)/./pages/api/auth/me.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/auth/me.ts"));
module.exports = __webpack_exports__;

})();