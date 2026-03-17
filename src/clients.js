import OpenAI from "openai";
import { Resend } from "resend";

export const openai = new OpenAI();
export const resend = new Resend(process.env.RESEND_API_KEY);
