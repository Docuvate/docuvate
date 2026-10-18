// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accept_user_invitation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AcceptUserInvitationRequestDto extends AcceptUserInvitationRequestDto {
  @override
  final String token;
  @override
  final String password;

  factory _$AcceptUserInvitationRequestDto(
          [void Function(AcceptUserInvitationRequestDtoBuilder)? updates]) =>
      (new AcceptUserInvitationRequestDtoBuilder()..update(updates))._build();

  _$AcceptUserInvitationRequestDto._(
      {required this.token, required this.password})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        token, r'AcceptUserInvitationRequestDto', 'token');
    BuiltValueNullFieldError.checkNotNull(
        password, r'AcceptUserInvitationRequestDto', 'password');
  }

  @override
  AcceptUserInvitationRequestDto rebuild(
          void Function(AcceptUserInvitationRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AcceptUserInvitationRequestDtoBuilder toBuilder() =>
      new AcceptUserInvitationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AcceptUserInvitationRequestDto &&
        token == other.token &&
        password == other.password;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, token.hashCode);
    _$hash = $jc(_$hash, password.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AcceptUserInvitationRequestDto')
          ..add('token', token)
          ..add('password', password))
        .toString();
  }
}

class AcceptUserInvitationRequestDtoBuilder
    implements
        Builder<AcceptUserInvitationRequestDto,
            AcceptUserInvitationRequestDtoBuilder> {
  _$AcceptUserInvitationRequestDto? _$v;

  String? _token;
  String? get token => _$this._token;
  set token(String? token) => _$this._token = token;

  String? _password;
  String? get password => _$this._password;
  set password(String? password) => _$this._password = password;

  AcceptUserInvitationRequestDtoBuilder() {
    AcceptUserInvitationRequestDto._defaults(this);
  }

  AcceptUserInvitationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _token = $v.token;
      _password = $v.password;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AcceptUserInvitationRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$AcceptUserInvitationRequestDto;
  }

  @override
  void update(void Function(AcceptUserInvitationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AcceptUserInvitationRequestDto build() => _build();

  _$AcceptUserInvitationRequestDto _build() {
    final _$result = _$v ??
        new _$AcceptUserInvitationRequestDto._(
            token: BuiltValueNullFieldError.checkNotNull(
                token, r'AcceptUserInvitationRequestDto', 'token'),
            password: BuiltValueNullFieldError.checkNotNull(
                password, r'AcceptUserInvitationRequestDto', 'password'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
