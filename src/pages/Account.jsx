import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi, formatApiError, notificationApi, uploadApi } from "../api";
import FormPanel from "../components/FormPanel";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import LangSelect from "../components/LangSelect";
import LocationPicker from "../components/LocationPicker";
import NotificationModal from "../components/NotificationModal";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { BUSINESS_TYPES, t, VEHICLES } from "../i18n";
import { formatWhen, initials } from "../utils";

const DESKTOP_SECTIONS = [
  { id: "profile", key: "basicDetails", Icon: UserIcon },
  { id: "shop", key: "storeDetails", Icon: StoreIcon },
  { id: "notifications", key: "notifications", Icon: BellIcon },
  { id: "security", key: "security", Icon: LockIcon },
  { id: "preferences", key: "preferences", Icon: SlidersIcon },
];
// On phones, Security + Preferences collapse into one "Settings" tab.
const MOBILE_SECTIONS = [
  { id: "profile", key: "basicDetails", Icon: UserIcon },
  { id: "shop", key: "storeDetails", Icon: StoreIcon },
  { id: "notifications", key: "notifications", Icon: BellIcon },
  { id: "settings", key: "settingsNav", Icon: SlidersIcon },
];

// Icons for the Shop details "What you deal in" pickers — looked up by the
// id already coming out of i18n's BUSINESS_TYPES / VEHICLES data.
const BUSINESS_TYPE_ICONS = { SHOP: StoreIcon, SERVICE_CENTER: WrenchIcon, BOTH: LayersIcon };
const VEHICLE_ICONS = {
  TWO_WHEELER: BikeIcon,
  FOUR_WHEELER: CarIcon,
  THREE_WHEELER: AutoIcon,
  COMMERCIAL: TruckIcon,
  EV: BoltIcon,
};

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setMobile(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}

export default function Account() {
  const { user, setUser, signIn, signOut } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const SECTIONS = isMobile ? MOBILE_SECTIONS : DESKTOP_SECTIONS;
  const raw = params.get("section");
  // Map the URL section onto whatever tabs this viewport actually has.
  const remap = (id) => {
    if (isMobile && (id === "security" || id === "preferences")) return "settings";
    if (!isMobile && id === "settings") return "security";
    return id;
  };
  const section = SECTIONS.some((s) => s.id === remap(raw)) ? remap(raw) : "profile";

  const [accounts, setAccounts] = useState(null);
  const [toast, setToast] = useState("");
  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }
  function go(id) {
    setParams(id === "profile" ? {} : { section: id });
  }

  useEffect(() => {
    let off = false;
    authApi
      .listAccounts()
      .then((l) => !off && setAccounts(Array.isArray(l) ? l : []))
      .catch(() => !off && setAccounts([]));
    return () => {
      off = true;
    };
  }, []);

  const current = SECTIONS.find((s) => s.id === section);
  const shared = { user, setUser, lang, flash };
  const waOn = user?.whatsappAlertsEnabled !== false;

  return (
    <div className="content account-content">
      <div className="account-wrap">
        <IdentityHero
          user={user}
          signIn={signIn}
          lang={lang}
          accounts={accounts}
          waOn={waOn}
          onTile={go}
        />

        <div className="account-body">
          {/* On phones, section switching lives in the profile-menu button in
              the top bar (MobileAccountMenu.jsx) instead of a nav rendered
              here — the bottom tab bar stays Home/Inventory/Alerts/Insights
              on every page, including this one. */}
          {!isMobile ? (
            <nav className="account-nav glass" aria-label={t(lang, "myAccount")}>
              <div className="account-nav-hd">{t(lang, "myAccount")}</div>
              {SECTIONS.map(({ id, key, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`account-nav-item${section === id ? " active" : ""}`}
                  aria-current={section === id ? "page" : undefined}
                  onClick={() => go(id)}
                >
                  <span className="account-nav-ic">
                    <Icon />
                  </span>
                  <span>{t(lang, key)}</span>
                </button>
              ))}
            </nav>
          ) : null}

          <div className="account-panel">
            <header className="account-panel-hd">
              <h1 className="account-panel-title">{t(lang, current.key)}</h1>
              <p className="account-panel-desc">{t(lang, `${current.id}Desc`)}</p>
            </header>

            {section === "profile" && <ProfileSection {...shared} />}
            {section === "shop" && <ShopSection {...shared} />}
            {section === "security" && <SecuritySection {...shared} />}
            {section === "notifications" && <NotificationsSection lang={lang} />}
            {section === "preferences" && (
              <>
                <PreferencesSection {...shared} />
                <HelpSupportSection lang={lang} />
                <AccountDangerZone lang={lang} flash={flash} signOut={signOut} nav={nav} />
              </>
            )}
            {section === "settings" && (
              <div className="account-settings-stack">
                <PreferencesSection {...shared} />
                <SecuritySection {...shared} />
                <HelpSupportSection lang={lang} />
                <AccountDangerZone lang={lang} flash={flash} signOut={signOut} nav={nav} />
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------------- hero card */
function IdentityHero({ user, signIn, lang, accounts, waOn, onTile }) {
  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || t(lang, "yourAccount");
  const multi = (accounts?.length || 0) > 1;

  return (
    <section className="account-hero glass">
      <div className="account-hero-id">
        <div className="account-hero-meta">
          <div className="account-hero-name">{name}</div>
          <div className="account-hero-sub">
            {user?.shopName ? <span>{user.shopName}</span> : null}
            {user?.phone ? <span>+91 {user.phone}</span> : null}
          </div>
        </div>
      </div>

      <div className="account-hero-side">
        {multi ? <SwitchShopMenu accounts={accounts} user={user} signIn={signIn} lang={lang} /> : null}
        <div className="account-hero-tiles">
          <WhatsAppTile waOn={waOn} lang={lang} onClick={() => onTile("preferences")} />
        </div>
      </div>
    </section>
  );
}

function WhatsAppTile({ waOn, lang, onClick }) {
  return (
    <button type="button" className="wa-tile wa-row" onClick={onClick}>
      <WhatsAppIcon />
      <span className="wa-row-label">{t(lang, "whatsappAlerts")}</span>
      <span className={`wa-row-value${waOn ? " on" : ""}`}>{waOn ? t(lang, "on") : t(lang, "off")}</span>
    </button>
  );
}

function SwitchShopMenu({ accounts, user, signIn, lang }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !root.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function switchTo(id) {
    setBusy(true);
    try {
      const data = await authApi.switchAccount(id);
      signIn(data);
      window.location.href = "/dashboard";
    } catch {
      setBusy(false);
    }
  }

  const shopName = user?.shopName || t(lang, "currentShop");

  return (
    <div className="shop-switch" ref={root}>
      <button
        type="button"
        className="shop-switch-btn shop-switch-card"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="shop-switch-card-ic">
          <StoreIcon />
        </span>
        <span className="shop-switch-card-text">
          <span className="shop-switch-card-lbl">{t(lang, "currentShop")}</span>
          <span className="shop-switch-name">{shopName}</span>
        </span>
        <CaretDownIcon />
      </button>
      {open ? (
        <div className="shop-switch-menu" role="menu">
          {accounts.map((acc) => {
            const isCurrent = acc.id === user?.id;
            return (
              <button
                key={acc.id}
                type="button"
                role="menuitem"
                className={`shop-switch-item${isCurrent ? " on" : ""}`}
                disabled={busy || isCurrent}
                onClick={() => switchTo(acc.id)}
              >
                <span>{acc.shopName || acc.name || t(lang, "unnamedShop")}</span>
                {isCurrent ? <CheckIcon /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* photo avatar with upload */
function PhotoAvatar({ url, fallback, lang, onUploaded, shape = "circle" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function pick(files) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadApi.uploadFile(file);
      await onUploaded(publicUrl);
    } catch (e) {
      alert(formatApiError(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`photo-av photo-av-${shape}`}>
      {url ? <img src={url} alt="" /> : <span className="photo-av-txt">{fallback}</span>}
      <button
        type="button"
        className="photo-av-edit"
        aria-label={url ? t(lang, "changePhoto") : t(lang, "addPhoto")}
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="photo-av-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={(e) => {
          pick(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- profile */
function ProfileSection({ user, setUser, lang, flash }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    altPhone: user?.altPhone || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };
  const dirty =
    form.firstName !== (user?.firstName || "") ||
    form.lastName !== (user?.lastName || "") ||
    form.email !== (user?.email || "") ||
    form.altPhone !== (user?.altPhone || "");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const updated = await authApi.updateProfile({
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim() || undefined,
        altPhone: form.altPhone.trim(),
      });
      setUser(updated);
      flash(t(lang, "saved"));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormPanel className="glass">
      <div className="account-grid">
        <FormField label={t(lang, "firstName")}>
          <input className="inp" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </FormField>
        <FormField label={t(lang, "lastName")}>
          <input className="inp" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </FormField>
        <FormField label={t(lang, "email")} hint={t(lang, "optional")}>
          <input className="inp" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </FormField>
        <FormField label={t(lang, "altPhone")} hint={t(lang, "optional")}>
          <input
            className="inp"
            inputMode="numeric"
            value={form.altPhone}
            onChange={(e) => set("altPhone", e.target.value.replace(/[^\d+\- ]/g, "").slice(0, 15))}
          />
        </FormField>
        <FormField label={t(lang, "mobile")} hint={t(lang, "mobileFixedHint")} className="account-grid-wide">
          <input className="inp" value={user?.phone ? `+91 ${user.phone}` : ""} disabled readOnly />
        </FormField>
      </div>
      <SaveRow busy={busy} disabled={!dirty} error={error} onSave={save} lang={lang} />
    </FormPanel>
  );
}

/* -------------------------------------------------------------------- shop */
function ShopSection({ user, setUser, lang, flash }) {
  const [form, setForm] = useState({
    shopName: user?.shopName || "",
    gstin: user?.gstin || "",
    businessType: user?.businessType || "SHOP",
    vehicleCategories: user?.vehicleCategories?.length ? user.vehicleCategories : ["FOUR_WHEELER"],
    address: user?.address || "",
    area: user?.area || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    geoLat: user?.geoLat ?? null,
    geoLng: user?.geoLng ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };
  const toggleVehicle = (id) =>
    setForm((f) => {
      const has = f.vehicleCategories.includes(id);
      const next = has ? f.vehicleCategories.filter((x) => x !== id) : [...f.vehicleCategories, id];
      return { ...f, vehicleCategories: next.length ? next : f.vehicleCategories };
    });

  async function save() {
    setBusy(true);
    setError("");
    try {
      const updated = await authApi.updateProfile({
        shopName: form.shopName.trim() || undefined,
        gstin: form.gstin.trim(),
        businessType: form.businessType,
        address: form.address.trim() || undefined,
        area: form.area.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
        geoLat: form.geoLat == null ? undefined : Number(form.geoLat),
        geoLng: form.geoLng == null ? undefined : Number(form.geoLng),
        vehicleCategories: form.vehicleCategories,
      });
      setUser(updated);
      flash(t(lang, "saved"));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  // Loose check, not enforced — just lets the field confirm a well-formed
  // GSTIN as the shopkeeper types instead of staying silent either way.
  const gstinValid = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gstin);

  return (
    <>
      <FormPanel className="glass">
        <div className="account-subsec-hd">
          <span className="account-subsec-ic">
            <StoreIcon />
          </span>
          <span className="account-subsec-ttl">{t(lang, "shopIdentityTitle")}</span>
        </div>

        <div className="shop-photo-row">
          <PhotoAvatar
            url={user?.shopPhotoUrl}
            fallback={initials(form.shopName || "S")}
            lang={lang}
            shape="rounded"
            onUploaded={async (shopPhotoUrl) => {
              const updated = await authApi.updateProfile({ shopPhotoUrl });
              setUser(updated);
              flash(t(lang, "saved"));
            }}
          />
          <div>
            <div className="shop-photo-ttl">{t(lang, "shopPhoto")}</div>
            <div className="shop-photo-sub">{t(lang, "shopPhotoHint")}</div>
          </div>
        </div>

        <div className="account-grid">
          <FormField label={t(lang, "shopName")} className="account-grid-wide">
            <input
              className="inp"
              value={form.shopName}
              placeholder="Sharma Auto Parts"
              onChange={(e) => set("shopName", e.target.value)}
            />
          </FormField>
          <FormField label={t(lang, "gstin")} hint={t(lang, "gstinHint")} className="account-grid-wide">
            <div className="field-check-wrap">
              <input
                className="inp"
                value={form.gstin}
                placeholder="22AAAAA0000A1Z5"
                onChange={(e) => set("gstin", e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15))}
              />
              {gstinValid ? (
                <span className="field-check" aria-hidden="true">
                  <CheckIcon />
                </span>
              ) : null}
            </div>
          </FormField>
        </div>
      </FormPanel>

      <FormPanel className="glass">
        <div className="account-subsec-hd">
          <span className="account-subsec-ic">
            <LayersIcon />
          </span>
          <span className="account-subsec-ttl">{t(lang, "shopBusinessTitle")}</span>
        </div>

        <FormField label={t(lang, "businessType")}>
          <div className="seg-row">
            {BUSINESS_TYPES.map((b) => {
              const Icon = BUSINESS_TYPE_ICONS[b.id] || StoreIcon;
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`seg${form.businessType === b.id ? " on" : ""}`}
                  onClick={() => set("businessType", b.id)}
                >
                  <Icon />
                  {b.label}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={t(lang, "vehiclesDeal")}>
          <div className="veh-chips">
            {VEHICLES.map((v) => {
              const Icon = VEHICLE_ICONS[v.id] || CarIcon;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`vchip${form.vehicleCategories.includes(v.id) ? " on" : ""}`}
                  onClick={() => toggleVehicle(v.id)}
                >
                  <Icon />
                  {v.label}
                </button>
              );
            })}
          </div>
        </FormField>
      </FormPanel>

      <FormPanel className="glass">
        <div className="account-subsec-hd">
          <span className="account-subsec-ic">
            <PinIcon />
          </span>
          <span className="account-subsec-ttl">{t(lang, "shopLocationTitle")}</span>
        </div>

        <div className="form-field">
          <LocationPicker
            compact
            showMap
            keepAddress
            value={form}
            onChange={(loc) => {
              setError("");
              setForm((f) => ({ ...f, ...loc }));
            }}
          />
        </div>

        <SaveRow busy={busy} error={error} onSave={save} lang={lang} />
      </FormPanel>
    </>
  );
}

/* ---------------------------------------------------------------- security */
function SecuritySection({ user, setUser, lang, flash }) {
  const hasPassword = !!user?.hasPassword;
  // Collapsed by default — most visits here are just to check the status,
  // not to actually change the password. Expands into the form on request.
  const [expanded, setExpanded] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setPw("");
    setPw2("");
    setOtp("");
    setStage("form");
    setError("");
  }

  function collapse() {
    reset();
    setExpanded(false);
  }

  async function startVerification() {
    setError("");
    if (pw.length < 8) return setError(t(lang, "passwordTooShort"));
    if (pw !== pw2) return setError(t(lang, "passwordsMismatch"));
    setBusy(true);
    try {
      await authApi.requestPasswordChangeOtp();
      setStage("otp");
      flash(t(lang, "otpSent"));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError("");
    try {
      await authApi.requestPasswordChangeOtp();
      flash(t(lang, "otpSent"));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp() {
    setError("");
    if (otp.length !== 6) return setError(t(lang, "enterOtp"));
    setBusy(true);
    try {
      await authApi.changePassword(otp, pw);
      setUser({ ...user, hasPassword: true });
      collapse();
      flash(t(lang, "passwordSaved"));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormPanel className="glass">
      <div className="account-note-row">
        <p className="account-note">{hasPassword ? t(lang, "passwordSet") : t(lang, "passwordNotSet")}</p>
        {!expanded ? (
          <button type="button" className="btn btn-s account-note-btn" onClick={() => setExpanded(true)}>
            {hasPassword ? t(lang, "changePassword") : t(lang, "createPassword")}
          </button>
        ) : null}
      </div>

      {!expanded ? null : stage === "form" ? (
        <>
          <div className="account-grid">
            <FormField label={t(lang, "newPassword")} hint={t(lang, "passwordRule")}>
              <PasswordField
                autoComplete="new-password"
                value={pw}
                onChange={(e) => {
                  setError("");
                  setPw(e.target.value);
                }}
              />
            </FormField>
            <FormField label={t(lang, "confirmPassword")}>
              <PasswordField
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => {
                  setError("");
                  setPw2(e.target.value);
                }}
              />
            </FormField>
          </div>
          {error ? <div className="err">{error}</div> : null}
          <div className="account-actions">
            <button type="button" className="btn btn-p account-btn" disabled={busy} onClick={startVerification}>
              {busy ? t(lang, "sending") : hasPassword ? t(lang, "changePassword") : t(lang, "createPassword")}
            </button>
            <button type="button" className="link" disabled={busy} onClick={collapse}>
              {t(lang, "cancel")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="account-note">
            {t(lang, "otpSentTo")} <strong>+91 {user?.phone}</strong>. {t(lang, "enterCodeToConfirm")}
          </p>
          <FormField label={t(lang, "enterOtp")}>
            <input
              className="inp account-otp"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(e) => {
                setError("");
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
            />
          </FormField>
          {error ? <div className="err">{error}</div> : null}
          <div className="account-actions">
            <button type="button" className="btn btn-p account-btn" disabled={busy || otp.length !== 6} onClick={submitOtp}>
              {busy ? t(lang, "saving") : hasPassword ? t(lang, "verifyAndUpdate") : t(lang, "verifyAndCreate")}
            </button>
            <button type="button" className="link" disabled={busy} onClick={resend}>
              {t(lang, "resend")}
            </button>
            <button type="button" className="link" disabled={busy} onClick={reset}>
              {t(lang, "back")}
            </button>
          </div>
        </>
      )}
    </FormPanel>
  );
}

/* ----------------------------------------------------------- notifications */
function NotificationsSection({ lang }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let off = false;
    notificationApi
      .list(1, 30)
      .then((d) => !off && setItems(Array.isArray(d?.content) ? d.content : []))
      .catch((e) => {
        if (!off) {
          setError(formatApiError(e));
          setItems([]);
        }
      });
    return () => {
      off = true;
    };
  }, []);

  async function openDetail(n) {
    setActive(n);
    if (!n.isRead) {
      setItems((rows) => rows.map((r) => (r.id === n.id ? { ...r, isRead: true } : r)));
      try {
        await notificationApi.markRead(n.id);
      } catch {
        /* non-fatal */
      }
    }
  }

  return (
    <FormPanel className="glass">
      {items === null ? (
        <p className="form-field-hint">{t(lang, "loading")}</p>
      ) : items.length === 0 ? (
        <p className="account-empty">{t(lang, "noAlerts")}</p>
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`notif-row${n.isRead ? "" : " unread"}`}
                onClick={() => openDetail(n)}
              >
                <span className="notif-row-main">
                  <span className="notif-row-title">{n.title}</span>
                  <span className="notif-row-body">{n.body}</span>
                </span>
                <span className="notif-row-time">{formatWhen(n.sentAt || n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? <div className="err">{error}</div> : null}
      {active ? <NotificationModal notification={active} onClose={() => setActive(null)} /> : null}
    </FormPanel>
  );
}

/* ------------------------------------------------------------- preferences */
function PreferencesSection({ user, setUser, lang, flash }) {
  const [busy, setBusy] = useState(false);
  const waOn = user?.whatsappAlertsEnabled !== false;

  async function toggleWa(next) {
    setBusy(true);
    setUser({ ...user, whatsappAlertsEnabled: next });
    try {
      const updated = await authApi.updateProfile({ whatsappAlertsEnabled: next });
      setUser(updated);
      flash(t(lang, "saved"));
    } catch (e) {
      setUser({ ...user, whatsappAlertsEnabled: !next });
      flash(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormPanel title={t(lang, "notifications")} className="glass">
        <div className="account-toggle-row">
          <div>
            <div className="account-toggle-ttl">{t(lang, "waAlerts")}</div>
            <div className="account-toggle-sub">{t(lang, "waAlertsHint")}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={waOn}
            aria-label={t(lang, "waAlerts")}
            className={`switch${waOn ? " on" : ""}`}
            disabled={busy}
            onClick={() => toggleWa(!waOn)}
          >
            <span className="switch-knob" />
          </button>
        </div>
        <p className="form-field-hint" style={{ marginTop: 10 }}>
          {t(lang, "notifChannelsHint")}
        </p>
      </FormPanel>

      <FormPanel title={t(lang, "language")} className="glass">
        <FormField>
          <LangSelect />
        </FormField>
      </FormPanel>
    </>
  );
}

function HelpSupportSection({ lang }) {
  return (
    <FormPanel title={t(lang, "helpSupport")} className="glass">
      <div className="support-links">
        <Link to="/help" className="support-link">
          <span className="support-link-ic">
            <HelpIcon />
          </span>
          <span>{t(lang, "help")}</span>
          <ChevronRightIcon />
        </Link>
        <Link to="/help/faqs" className="support-link">
          <span className="support-link-ic">
            <HelpIcon />
          </span>
          <span>{t(lang, "faqs")}</span>
          <ChevronRightIcon />
        </Link>
        <Link to="/contact" className="support-link">
          <span className="support-link-ic">
            <ContactIcon />
          </span>
          <span>{t(lang, "contact")}</span>
          <ChevronRightIcon />
        </Link>
        <Link to="/terms" className="support-link">
          <span className="support-link-ic">
            <TermsIcon />
          </span>
          <span>{t(lang, "terms")}</span>
          <ChevronRightIcon />
        </Link>
      </div>
    </FormPanel>
  );
}

/* -------------------------------------------------- logout + delete account
   Always the last thing on the page — after Security, not sandwiched
   between Help & Support and Change password. */
function AccountDangerZone({ lang, flash, signOut, nav }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function logout() {
    await signOut();
    nav("/auth?mode=login", { replace: true });
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await authApi.deleteAccount();
      await signOut();
      nav("/auth?mode=login", { replace: true });
    } catch (e) {
      flash(formatApiError(e));
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="account-logout-plain account-logout-center" onClick={logout}>
        <LogoutIcon />
        <span>{t(lang, "logout")}</span>
      </button>

      <button type="button" className="account-delete-btn" onClick={() => setConfirming(true)}>
        {t(lang, "deleteAccount")}
      </button>

      {confirming ? (
        <div className="overlay" onClick={() => !busy && setConfirming(false)}>
          <div className="modal delete-modal" onClick={(e) => e.stopPropagation()}>
            <p className="delete-modal-text">{t(lang, "deleteAccountWarning")}</p>
            <div className="delete-modal-actions">
              <button type="button" className="btn btn-g" disabled={busy} onClick={() => setConfirming(false)}>
                {t(lang, "no")}
              </button>
              <button type="button" className="btn btn-d" disabled={busy} onClick={deleteAccount}>
                {busy ? t(lang, "saving") : t(lang, "yes")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ shared */
function SaveRow({ busy, disabled, error, onSave, lang }) {
  return (
    <>
      {error ? <div className="err">{error}</div> : null}
      <div className="account-actions">
        <button type="button" className="btn btn-p account-btn" disabled={busy || disabled} onClick={onSave}>
          {busy ? t(lang, "saving") : t(lang, "saveChanges")}
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------- icons */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}
function CaretDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
/* Recognisable WhatsApp glyph on its brand-green circle — filled, not an
   outline icon, so it reads as "WhatsApp" at a glance like the rest of the
   set doesn't need to. */
function WhatsAppIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" className="wa-icon" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        fill="#fff"
        d="M16 7.5a8.47 8.47 0 0 0-7.24 12.86L7.5 24.5l4.27-1.2A8.47 8.47 0 1 0 16 7.5zm0 1.6a6.87 6.87 0 1 1-3.7 12.66l-.27-.17-2.53.7.7-2.44-.18-.28A6.87 6.87 0 0 1 16 9.1z"
      />
      <path
        fill="#fff"
        d="M13.2 12.1c-.17-.38-.35-.39-.51-.4h-.44c-.15 0-.4.06-.61.3-.21.24-.8.78-.8 1.9s.82 2.2.93 2.35c.12.15 1.58 2.5 3.9 3.4 1.93.76 2.32.61 2.74.57.42-.04 1.35-.55 1.54-1.08.19-.53.19-.98.13-1.08-.06-.1-.21-.15-.44-.27-.23-.11-1.35-.67-1.56-.74-.21-.08-.36-.11-.51.11-.15.23-.58.74-.71.89-.13.15-.26.17-.49.06-.23-.11-.96-.35-1.82-1.13-.67-.6-1.13-1.34-1.26-1.57-.13-.23-.01-.35.1-.47.1-.1.23-.26.35-.4.11-.13.15-.23.23-.38.08-.15.04-.28-.02-.4-.06-.11-.5-1.26-.7-1.71z"
      />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9V7l1.5-3h13L20 7v2a2.5 2.5 0 0 1-4.5 1.5A2.5 2.5 0 0 1 12 11a2.5 2.5 0 0 1-3.5-.5A2.5 2.5 0 0 1 4 9z" />
      <path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6.5a3.5 3.5 0 1 1-5 5L4 17l3 3 5.5-5.5a3.5 3.5 0 1 0 5-5l-1.8 1.8-2-.7-.7-2z" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}
function BikeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-9.5 11.5L9 10h4l3 4h3.5M9 10 7 6h3" />
    </svg>
  );
}
function CarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function AutoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16V9a1 1 0 0 1 1-1h6l4 4h4a1 1 0 0 1 1 1v3" />
      <path d="M4 16h16" />
      <circle cx="7" cy="18.3" r="1.7" />
      <circle cx="17" cy="18.3" r="1.7" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h10v9H3z" />
      <path d="M13 11h4l3 3v2h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}
function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.5" />
      <circle cx="12" cy="16.6" r="0.1" fill="currentColor" />
    </svg>
  );
}
function ContactIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v12H8l-4 4V5z" />
    </svg>
  );
}
function TermsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 17l5-5-5-5M21 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </svg>
  );
}
