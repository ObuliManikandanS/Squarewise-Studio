'use client';
import {createAuthClient} from 'better-auth/react';
const client=createAuthClient();
function checked<T>(result:{data:T;error: {message?:string}|null}){if(result.error)throw Error(result.error.message||'Account request failed.');return result.data}
export async function getUser(){return checked(await client.getSession())?.user??null}
export async function getSettings(){const r=await fetch('/api/me',{cache:'no-store'});const data=await r.json() as {available:boolean;recoveryAvailable:boolean;emailVerification:boolean};if(!r.ok||!data.available)throw Error('Account service unavailable.');return data}
export async function handleAuthCallback(){return new URLSearchParams(window.location.search).has('token')?{type:'recovery'}:null}
export async function login(email:string,password:string){return checked(await client.signIn.email({email,password}))}
export async function signup(email:string,password:string,data:{full_name:string}){const settings=await getSettings();checked(await client.signUp.email({email,password,name:data.full_name}));return {confirmedAt:!settings.emailVerification}}
export async function logout(){return checked(await client.signOut())}
export async function requestPasswordRecovery(email:string){const settings=await getSettings();if(!settings.recoveryAvailable)throw Error('Email recovery is not configured yet.');return checked(await client.requestPasswordReset({email,redirectTo:window.location.origin+'/sign-in?reset=1'}))}
export async function updateUser(input:{password?:string;data?:{full_name:string}}){if(input.password){const token=new URLSearchParams(window.location.search).get('token');if(!token)throw Error('Open the password-reset link from your email.');return checked(await client.resetPassword({newPassword:input.password,token}))}return checked(await client.updateUser({name:input.data?.full_name}))}
