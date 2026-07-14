import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Nieprawidłowy adres e-mail' })
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Hasło musi mieć co najmniej 8 znaków' })
  @MaxLength(128)
  password!: string;

  // Apteka z rejestru, do której zgłasza się manager.
  @IsString()
  @MaxLength(64)
  pharmacyId!: string;

  // Uzasadnienie / numer zezwolenia (dla admina do weryfikacji claimu).
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  evidence!: string;
}
