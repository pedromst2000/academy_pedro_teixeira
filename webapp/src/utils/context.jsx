import React, { useContext, useEffect, useRef, useState } from "react";
import { createContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import endpoints from "./endpoints";
import api from "./api";
import { message, notification, Tour } from "antd";
import i18n from "./i18n";
import { socket } from "./socket";
import { useTranslation } from "react-i18next";

export const Context = createContext();

api.init();

const ContextProvider = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);
	const [user, setUser] = useState({});
	const [roles, setRoles] = useState([]);
	const [courses, setCourses] = useState([]);
	const [languages, setLanguages] = useState([]);
	const [selectedLanguage, setSelectedLanguage] = useState(null);
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [notifications, setNotifications] = useState([]);
	const [inbox, setInbox] = useState([]);
	const [selectedInbox, setSelectedInbox] = useState({});
	const [personalization, setPersonalization] = useState({});

	const inboxRef = useRef(inbox);
	const selectedInboxRef = useRef(selectedInbox);
	const isLoadingLanguagesRef = useRef(false);

	const [windowDimension, setWindowDimension] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	const { t } = useTranslation();

	const [tablesName] = useState({
		user: t("User"),
		course: t("Course"),
		test: t("Test"),
		language: t("Language"),
		document: t("Document"),
		download: t("Download"),
		personalization: t("Personalization"),
	});

	const [messageApi, contextMessageHolder] = message.useMessage();
	const [notificationApi, contextNotificationHolder] =
		notification.useNotification();

	const navigate = useNavigate();

	useEffect(() => {
		getData();
		getLanguages();
	}, []);

	// Atualiza a personalização sempre que a linguagem ou os idiomas disponíveis mudam
	useEffect(() => {
		if (languages && languages.length > 0) {
			getPersonalization(languages);
		}
	}, [i18n.language, languages]);



	useEffect(() => {
		if (Object.keys(user).length === 0) return;
		else socket.connect();

		socket.on("connect", () => {
			console.log("🟢 Socket ligado", socket.id);
			console.log("User: ", user);
			console.log("socket.connected: ", socket.connected);
			if (user && user.id)
				socket.emit("register_user", {
					userId: user.id,
					lang: user.id_lang,
					country: user.country,
					id_role: user.id_role,
				}); // Exemplo
		});

		socket.on("disconnect", () => {
			console.log("🔴 Socket desligado");
		});

		socket.on("reconnect_attempt", (attempt) => {
			console.log(`🔄 A tentar reconectar... tentativa ${attempt}`);
		});

		socket.on("reconnect", () => {
			console.log("🟢 Reconectado com sucesso!");
			if (user && user.id)
				socket.emit("register_user", {
					userId: user.id,
					lang: user.id_lang,
					country: user.country,
					id_role: user.id_role,
				}); // Exemplo
		});

		socket.on("received", (data) => receivedNotification(data));

		return () => {
			socket.off("connect");
			socket.off("disconnect");
			socket.off("reconnect_attempt");
			socket.off("reconnect");
			socket.off("received");
		};
	}, [user]);

	useEffect(() => {
		inboxRef.current = inbox;
	}, [inbox]);

	useEffect(() => {
		selectedInboxRef.current = selectedInbox;
	}, [selectedInbox]);

	useEffect(() => {
		const detectSize = () => {
			setWindowDimension({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};
		window.addEventListener("resize", detectSize);

		return () => {
			window.removeEventListener("resize", detectSize);
		};
	}, [windowDimension]);

	function receivedNotification(d) {
		notificationApi.open({
			type: "info",
			placement: "top",
			title: <div dangerouslySetInnerHTML={{ __html: d.title }}></div>,
			description: (
				<div dangerouslySetInnerHTML={{ __html: d.description }}></div>
			),
		});

		if (d.type === "message" || d.type === "thread") {
			setInbox((prev) =>
				prev.filter((m) =>
					m.id === d.meta_data.id_thread
						? prev.filter((m) =>
								m.id === d.meta_data.id_thread
									? {
											...m,
											text: d.meta_data.text,
											from_id_user: d.meta_data.from_id_user,
											to_id_user: d.meta_data.to_id_user,
											unread_messages: ++m.unread_messages,
										}
									: m,
							)
						: [...prev, d.meta_data],
				),
			);

			if (
				selectedInboxRef.current &&
				selectedInboxRef.current.id === d.meta_data.id_thread
			)
				setSelectedInbox((prev) => ({
					...prev,
					text: d.meta_data.text,
					from_id_user: d.meta_data.from_id_user,
					to_id_user: d.meta_data.to_id_user,
					unread_messages: 0,
				}));
		} else {
			const auxNotifications = Object.assign([], notifications);
			auxNotifications.unshift(d);
			setNotifications(auxNotifications);
		}
	}

	async function getLanguages() {
		// Prevenir chamadas simultâneas para evitar Race Conditions
		if (isLoadingLanguagesRef.current) {
			// console.log('⚠️ getLanguages already running, skipping duplicate call');
			return;
		}

		isLoadingLanguagesRef.current = true;

		try {
			// console.log('🔵 getLanguages started');
			const res = await axios.get(endpoints.language.read);
			// console.log('✅ Language data fetched:', res.data);
			setLanguages(res.data);

			const auxLanguages = res.data;
			const currentLang = i18n.language;
			// console.log('🔵 Current language:', currentLang);

			for (let i = 0; i < auxLanguages.length; i++) {
				if (auxLanguages[i].translation) {
					// console.log('🔵 Processing language:', auxLanguages[i].code);
					const translation = JSON.parse(auxLanguages[i].translation).reduce(
						(acc, item) => {
							acc[item.key] = item.value;
							return acc;
						},
						{},
					);

					// console.log('✅ Clearing old bundle for:', auxLanguages[i].code);
					i18n.removeResourceBundle(auxLanguages[i].code, "translation");
					i18n.addResources(auxLanguages[i].code, "translation", translation);
				}
			}

			const otherLang = currentLang === "en" ? "pt" : "en";
			// console.log('⚠️ Forcing language switch to:', otherLang, 'then:', currentLang);
			await i18n.changeLanguage(otherLang);
			await i18n.changeLanguage(currentLang);
			// console.log('✅ Language switched back, triggering re-render');

			const idLangStorage = localStorage.getItem("id_lang");
			const defaultLanguage = res.data.find((_l) => _l.is_default === 1);

			// Fallback se o localStorage estiver corrompido ou ausente
			setSelectedLanguage(
				(idLangStorage && res.data.find((_l) => _l.id === parseInt(idLangStorage))) || defaultLanguage
			);
			// console.log('✅ getLanguages completed');
		} catch (err) {
			console.error('Error in getLanguages:', err);
		} finally {
			isLoadingLanguagesRef.current = false;
		}
	}

	async function getCourses(auxUser) {
		try {
			const res = await axios.get(endpoints.course.read, {
				params: { id_user: auxUser ? auxUser.id : user.id },
			});
			setCourses(res.data.courses);
		} catch (err) {
			console.log(err);
		}
	}

	async function getNotifications(auxUser) {
		try {
			const res = await axios.get(endpoints.notification.readByUser, {
				params: { id_user: auxUser ? auxUser.id : user.id },
			});
			setNotifications(res.data);
		} catch (err) {
			console.log(err);
		}
	}

	async function getMessages(auxUser) {
		try {
			const res = await axios.get(
				auxUser.id_role === 1
					? endpoints.inbox.readBySupport
					: endpoints.inbox.readByUser,
				{
					params: { id_user: auxUser.id },
				},
			);
			setInbox(res.data);
		} catch (err) {
			console.log(err);
		}
	}

	async function getData() {
		let token = localStorage.getItem("token");
		if (token) {
			try {
				const res = await axios.post(endpoints.auth.verifyToken, {
					data: token,
				});
				login({ user: res.data.user, token: token });
				getNotifications(res.data.user);
				getMessages(res.data.user);
				getCourses(res.data.user);
				setTimeout(() => {
					setIsLoading(false);
				}, 3000);
			} catch (err) {
				console.log(err);
				setIsLoggedIn(false);
				navigate(`/${i18n.language}/login`);
				setTimeout(() => {
					setIsLoading(false);
				}, 3000);
			}
		} else {
			if (window.location.pathname.includes("admin"))
				navigate(`/${i18n.language}/login`);
			setTimeout(() => {
				setIsLoading(false);
			}, 3000);
		}
	}

	async function getInfoData(token) {
		try {
			const coursesList = await axios.get(endpoints.user.read, {
				headers: { Authorization: token },
			});
			setCourses(coursesList.data);
			const rolesList = await axios.get(endpoints.role.read, {
				headers: { Authorization: token },
			});
			setRoles(rolesList.data);
		} catch (err) {
			console.log(err);
		}
	}

	async function getPersonalization(languagesData) {
		if (languagesData.length === 0) return;
		try {
			const langStorage = localStorage.getItem("i18nextLng");
			const auxLanguage = languagesData.filter((_l) =>
				langStorage ? _l.code === langStorage : _l.is_default === 1,
			)[0];

			const res = await axios.get(endpoints.personalization.readByLang, {
				params: { id_lang: auxLanguage.id },
			});
			setPersonalization(
				res.data.filter((s) => s.name === "homepage_text")[0] ?? {},
			);
		} catch (err) {
			console.error('Error in getPersonalization:', err);
		}
	}

	async function logout() {
		localStorage.removeItem("token");
		const auxUser = JSON.parse(JSON.stringify(user));
		setIsLoggedIn(false);
		setIsLoading(true);
		setUser({});
		navigate(`/${i18n.language}/login`);
		createLog({
			id_user: auxUser.id,
			action: "logout",
			id_lang:
				auxUser.id_role !== 1
					? languages.filter((l) => l.code === i18n.language)[0].id
					: selectedLanguage.id,
		});
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	}

	function login(res) {
		localStorage.setItem("token", res.token);
		api.token(res.token);
		getInfoData(res.token);
		setUser(res.user);

		console.log(window.location.pathname);

		setIsLoggedIn(true);
	}

	async function createLog(obj) {
		try {
			const res = await axios.post(endpoints.logs.create, {
				data: obj,
			});
		} catch (err) {
			console.log(err);
		}
	}

	function create(obj) {
		return new Promise(async (resolve, reject) => {
			try {
				const res = await axios.post(endpoints[obj.table].create, {
					data: obj.data,
				});
				createLog({
					id_user: user.id,
					action: "create",
					table_name: obj.table,
					meta_data: JSON.stringify({ ...obj.data, id: res.insertId }),
					id_lang: selectedLanguage.id,
				});
				messageApi.open({
					type: "success",
					content: `${tablesName[obj.table]} ${t("was successfully created")}.`,
				});
				resolve(res);
			} catch (err) {
				messageApi.open({
					type: "error",
					content: t(`Somethins went wrong, please try again.`),
				});
				reject(err);
			}
		});
	}

	function update(obj) {
		return new Promise(async (resolve, reject) => {
			try {
				const res = await axios.post(endpoints[obj.table].update, {
					data: obj.data,
				});
				createLog({
					id_user: user.id,
					action: "update",
					table_name: obj.table,
					meta_data: JSON.stringify(obj.data),
					id_lang: selectedLanguage.id,
				});
				messageApi.open({
					type: "success",
					content: `${tablesName[obj.table]} ${t("was successfully updated")}.`,
				});
				resolve(res);
			} catch (err) {
				messageApi.open({
					type: "error",
					content: t(`Somethins went wrong, please try again.`),
				});
				reject(err);
			}
		});
	}

	return (
		<Context.Provider
			value={{
				isLoggedIn,
				setIsLoggedIn,
				user,
				setUser,
				login,
				logout,
				isLoading,
				setIsLoading,
				messageApi,
				notificationApi,
				createLog,
				update,
				create,
				courses,
				setCourses,
				languages,
				getLanguages,
				isLoadingLanguage,
				setIsLoadingLanguage,
				t,
				roles,
				setRoles,
				windowDimension,
				setWindowDimension,
				selectedLanguage,
				setSelectedLanguage,
				notifications,
				setNotifications,
				inbox,
				setInbox,
				selectedInbox,
				setSelectedInbox,
				personalization,
			}}
		>
			{contextMessageHolder}
			{contextNotificationHolder}
			{children}
		</Context.Provider>
	);
};

export default ContextProvider;
