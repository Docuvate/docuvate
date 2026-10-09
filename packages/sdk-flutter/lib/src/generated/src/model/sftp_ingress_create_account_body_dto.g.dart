// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sftp_ingress_create_account_body_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SftpIngressCreateAccountBodyDto
    extends SftpIngressCreateAccountBodyDto {
  @override
  final String displayName;
  @override
  final String? username;
  @override
  final String? passwordPlain;
  @override
  final String? sshPublicKey;
  @override
  final String? folderId;
  @override
  final BuiltList<String>? labelIds;
  @override
  final bool? mapSubfolders;

  factory _$SftpIngressCreateAccountBodyDto(
          [void Function(SftpIngressCreateAccountBodyDtoBuilder)? updates]) =>
      (new SftpIngressCreateAccountBodyDtoBuilder()..update(updates))._build();

  _$SftpIngressCreateAccountBodyDto._(
      {required this.displayName,
      this.username,
      this.passwordPlain,
      this.sshPublicKey,
      this.folderId,
      this.labelIds,
      this.mapSubfolders})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        displayName, r'SftpIngressCreateAccountBodyDto', 'displayName');
  }

  @override
  SftpIngressCreateAccountBodyDto rebuild(
          void Function(SftpIngressCreateAccountBodyDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SftpIngressCreateAccountBodyDtoBuilder toBuilder() =>
      new SftpIngressCreateAccountBodyDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SftpIngressCreateAccountBodyDto &&
        displayName == other.displayName &&
        username == other.username &&
        passwordPlain == other.passwordPlain &&
        sshPublicKey == other.sshPublicKey &&
        folderId == other.folderId &&
        labelIds == other.labelIds &&
        mapSubfolders == other.mapSubfolders;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, username.hashCode);
    _$hash = $jc(_$hash, passwordPlain.hashCode);
    _$hash = $jc(_$hash, sshPublicKey.hashCode);
    _$hash = $jc(_$hash, folderId.hashCode);
    _$hash = $jc(_$hash, labelIds.hashCode);
    _$hash = $jc(_$hash, mapSubfolders.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SftpIngressCreateAccountBodyDto')
          ..add('displayName', displayName)
          ..add('username', username)
          ..add('passwordPlain', passwordPlain)
          ..add('sshPublicKey', sshPublicKey)
          ..add('folderId', folderId)
          ..add('labelIds', labelIds)
          ..add('mapSubfolders', mapSubfolders))
        .toString();
  }
}

class SftpIngressCreateAccountBodyDtoBuilder
    implements
        Builder<SftpIngressCreateAccountBodyDto,
            SftpIngressCreateAccountBodyDtoBuilder> {
  _$SftpIngressCreateAccountBodyDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _username;
  String? get username => _$this._username;
  set username(String? username) => _$this._username = username;

  String? _passwordPlain;
  String? get passwordPlain => _$this._passwordPlain;
  set passwordPlain(String? passwordPlain) =>
      _$this._passwordPlain = passwordPlain;

  String? _sshPublicKey;
  String? get sshPublicKey => _$this._sshPublicKey;
  set sshPublicKey(String? sshPublicKey) => _$this._sshPublicKey = sshPublicKey;

  String? _folderId;
  String? get folderId => _$this._folderId;
  set folderId(String? folderId) => _$this._folderId = folderId;

  ListBuilder<String>? _labelIds;
  ListBuilder<String> get labelIds =>
      _$this._labelIds ??= new ListBuilder<String>();
  set labelIds(ListBuilder<String>? labelIds) => _$this._labelIds = labelIds;

  bool? _mapSubfolders;
  bool? get mapSubfolders => _$this._mapSubfolders;
  set mapSubfolders(bool? mapSubfolders) =>
      _$this._mapSubfolders = mapSubfolders;

  SftpIngressCreateAccountBodyDtoBuilder() {
    SftpIngressCreateAccountBodyDto._defaults(this);
  }

  SftpIngressCreateAccountBodyDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _username = $v.username;
      _passwordPlain = $v.passwordPlain;
      _sshPublicKey = $v.sshPublicKey;
      _folderId = $v.folderId;
      _labelIds = $v.labelIds?.toBuilder();
      _mapSubfolders = $v.mapSubfolders;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SftpIngressCreateAccountBodyDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$SftpIngressCreateAccountBodyDto;
  }

  @override
  void update(void Function(SftpIngressCreateAccountBodyDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SftpIngressCreateAccountBodyDto build() => _build();

  _$SftpIngressCreateAccountBodyDto _build() {
    _$SftpIngressCreateAccountBodyDto _$result;
    try {
      _$result = _$v ??
          new _$SftpIngressCreateAccountBodyDto._(
              displayName: BuiltValueNullFieldError.checkNotNull(displayName,
                  r'SftpIngressCreateAccountBodyDto', 'displayName'),
              username: username,
              passwordPlain: passwordPlain,
              sshPublicKey: sshPublicKey,
              folderId: folderId,
              labelIds: _labelIds?.build(),
              mapSubfolders: mapSubfolders);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'labelIds';
        _labelIds?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'SftpIngressCreateAccountBodyDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
