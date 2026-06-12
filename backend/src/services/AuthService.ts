import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import { Errors, ISessionUser } from '@src/models/common/types';
import { IUser } from '@src/models/User.model';
import AuthRepo from '@src/repos/AuthRepo';
import UserRepo from '@src/repos/UserRepo';
import JwtUtils from '@src/common/utils/session-authenticate'
import EnvVars from '@src/common/constants/env';
import nodemailer from 'nodemailer';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Authenticate a user.
 */
async function authenticate(username: string, passwordInput: string): Promise<IUser> {
  const user = await UserRepo.getOne(username);
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }
  if (!user.isActivated) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }
  const isMatch = await UserRepo.comparePassword(passwordInput, user.password);
  if (!isMatch) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
  }

  return user;
}


async function refresh(token: string) {
  const tokenDb = await AuthRepo.findToken(token);
  if (!tokenDb) throw new Error('Token not found in database');

  if (tokenDb.expires_at < new Date()) {
    await AuthRepo.deleteToken(token);
    throw new Error('Token expired');
  }

  await JwtUtils.verifyToken(token,EnvVars.JwtRefreshTokenKey);

  const sessionUser: ISessionUser = {
    userId: tokenDb.user.user_id,
    username: tokenDb.user.username,
    role: tokenDb.user.role,
  };

  return JwtUtils.generateAccessToken(sessionUser);
}

/**
 * Sends a registration verification email containing a secure activation link.
 * @param email - The recipient's email address.
 * @param username - The username of the registered user.
 * @param token - The unique crypto token generated for account activation.
 */
async function sendVerificationLinkEmail(email: string, username: string, token: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EnvVars.MailUser,
      pass: EnvVars.MailPass,
    },
  });
  const verificationLink = `http://localhost:3001/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Management System" <${EnvVars.MailUser}>`,
    to: email,
    subject: 'Activate Your Account',
    html: `
      <div style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%; padding-top: 40px; padding-bottom: 40px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px border #e2e8f0; margin: 0 auto;">
          
          <tr>
            <td style="background-color: #4f46e5; height: 6px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 40px 32px; text-align: left;">
              <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px; font-weight: 700; line-height: 32px;">Welcome aboard, ${username}!</h2>
              
              <p style="margin: 0 0 24px 0; color: #64748b; font-size: 15px; line-height: 24px;"> Thank you for creating an account with our platform. To complete your registration and secure your profile, please verify your email address. </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; display: inline-block; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); transition: background-color 0.2s ease;"> Activate Account </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 13px; line-height: 20px; font-style: italic; text-align: center;"> Note: This secure activation link is valid for <strong>1 hour</strong> only. </p>
              
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; line-height: 20px;"> If the button above doesn't work, please copy and paste this URL directly into your web browser: </p>
              <p style="margin: 0; color: #4f46e5; font-size: 13px; line-height: 20px; word-break: break-all;">
                <a href="${verificationLink}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${verificationLink}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 18px;"> This is an automated security system notification message. Please do not reply directly to this email. </p>
            </td>
          </tr>

        </table>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  authenticate,
  refresh,
  sendVerificationLinkEmail
} as const;
