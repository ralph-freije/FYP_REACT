import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getProfile, updateProfile, uploadAvatar } from "../api/profileApi";
import "./SettingsPage.css";

export default function SettingsPage() {

const [profile,setProfile] = useState(null);

useEffect(()=>{

const loadProfile = async()=>{

try{
  const res = await getProfile();
  setProfile(res.data.user);
}catch(err){
  console.error(err);

  // Only logout if UNAUTHORIZED
  if (err.response?.status === 401) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }
}
};

loadProfile();

},[]);

if(!profile) return <p style={{padding:"40px"}}>Loading profile...</p>;

const handleChange=(field,value)=>{
setProfile({
...profile,
profile:{
...profile.profile,
[field]:value
}
});
};

const handleAvatarUpload = async(e)=>{
const file = e.target.files[0];

const formData = new FormData();
formData.append("avatar",file);

await uploadAvatar(formData);

const res = await getProfile();
setProfile(res.data.user);
};

const saveProfile = async()=>{
await updateProfile({
name:profile.name,
weekly_report:profile.profile?.weekly_report,
sustainability_alerts:profile.profile?.sustainability_alerts,
public_profile:profile.profile?.public_profile
});

alert("Profile updated");
};

// ✅ LOGOUT FIX
const handleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
};

return(

<div className="settings-layout">

<Sidebar/>

<div className="settings-main">

<h1>Settings</h1>

<p className="subtitle">
Manage your account preferences and climate impact visibility.
</p>

<div className="card">

<h3>Account Information</h3>

<div className="avatar-upload">

<img
src={profile.profile?.profile_picture || "/default-avatar.png"}
className="profile-pic"
/>

<label className="upload-btn">
Upload Photo
<input type="file" hidden onChange={handleAvatarUpload}/>
</label>

</div>

<div>
<label>Name</label>
<input
value={profile.name}
onChange={(e)=>setProfile({...profile,name:e.target.value})}
/>
</div>

<div>
<label>Email Address</label>
<input value={profile.email} readOnly/>
</div>

</div>

{/* NOTIFICATIONS */}

<div className="card">

<h3>Notification Preferences</h3>

<div className="toggle">
<div>
<b>Weekly Impact Report</b>
<p>Receive a summary every Monday.</p>
</div>

<div 
className={`switch ${profile.profile?.weekly_report ? "active" : ""}`}
onClick={()=>handleChange("weekly_report",!profile.profile?.weekly_report)}
>
<div className="dot"></div>
</div>

</div>

<div className="toggle">
<div>
<b>Sustainability Alerts</b>
<p>Alerts when footprint exceeds target.</p>
</div>

<div 
className={`switch ${profile.profile?.sustainability_alerts ? "active" : ""}`}
onClick={()=>handleChange("sustainability_alerts",!profile.profile?.sustainability_alerts)}
>
<div className="dot"></div>
</div>

</div>

</div>

{/* PRIVACY */}

<div className="card">

<h3>Privacy & Visibility</h3>

<div className="toggle">

<div>
<b>Public Profile</b>
<p>Allow others to see achievements.</p>
</div>

<div 
className={`switch ${profile.profile?.public_profile ? "active" : ""}`}
onClick={()=>handleChange("public_profile",!profile.profile?.public_profile)}
>
<div className="dot"></div>
</div>

</div>

</div>

<div className="actions">
<button className="save" onClick={saveProfile}>
Save Changes
</button>
</div>

<div className="danger">

<h3>Account Actions</h3>

<div className="danger-buttons">

<button className="logout-btn" onClick={handleLogout}>
Logout
</button>

<button className="delete-btn">
Delete Account
</button>

</div>

</div>

</div>

</div>

);

}