import { IsBoolean, IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message: 'Password must include uppercase, lowercase, number, and symbol',
  })
  password!: string;

  @IsBoolean()
  ageConfirmed!: boolean;

  @IsString()
  termsVersion!: string;

  @IsString()
  privacyPolicyVersion!: string;

  @IsString()
  acceptableUsePolicyVersion!: string;
}
