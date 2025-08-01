'use server';

import { initFirebaseAdmin } from '@/firebase/admin';
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7 * 1000;

export async function signUp(params:SignUpParams){
    const {uid,name,email}=params;
    const { db } = initFirebaseAdmin();

    try {
        const userRecord=await db.collection('users').doc(uid).get();

        if(userRecord.exists){
            return {
                success: false,
                message: 'User already exists. Please sign in instead.'
            };
        }

        await db.collection('users').doc(uid).set({
            name,email
        })

        return {
            success:true,
            message:'Account created successfully. Please sign in.',
        }
    } catch (error:any) {
        console.error('Error creating a user',error);

        if(error.code==='auth/email-already-exists'){
            return{
                success:false,
                message:'This email is already in use.'
            }
        }

        return{
            success:false,
            message:'Failed to create an account.'
        }
    }
}

export async function setSesssionCookie(idToken:string){
    const cookieStore=await cookies();
    const { auth } = initFirebaseAdmin();

    const sessionCookie=await auth.createSessionCookie(idToken,{
        expiresIn:ONE_WEEK ,
    })

    cookieStore.set('session',sessionCookie,{
        maxAge:ONE_WEEK,
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        path:'/',
        sameSite:'lax',
    })
}

export async function signIn(params:SignInParams){
    const {email,idToken}=params;
    const {auth}=initFirebaseAdmin();

    try {
        const userRecord=await auth.getUserByEmail(email);

        if(!userRecord){
            return {
                success: false,
                message: 'User does not exist. Create an account instead.'
            };
        }

        await setSesssionCookie(idToken);
    } catch (error) {
        console.log(error);
        return{
            success:false,
            message:'Failed to log into an account.'
        }
    }
}

export async function getCurrentUser(): Promise<User | null>{
    const cookiStore=await cookies();
    const { auth } = initFirebaseAdmin();
    const { db } = initFirebaseAdmin();

    const sessionCookie=cookiStore.get('session')?.value;

    if(!sessionCookie) return null;

    try {
        const decodedClaims=await auth.verifySessionCookie(sessionCookie,true);

        const userRecord=await db.collection('users').doc(decodedClaims.uid).get();

        if(!userRecord.exists) return null;

        return{
            ...userRecord.data(),
            id:userRecord.id
        } as User;
    } catch (error) {
       console.log(error);
       return null; 
    }
}

export async function isAuthenticated(){
    const user=await getCurrentUser();

    return !!user; 
    // Converts object to boolean
}

