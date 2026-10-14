// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ban_admin_user_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$BanAdminUserRequestDto extends BanAdminUserRequestDto {
  @override
  final String? reason;

  factory _$BanAdminUserRequestDto(
          [void Function(BanAdminUserRequestDtoBuilder)? updates]) =>
      (BanAdminUserRequestDtoBuilder()..update(updates))._build();

  _$BanAdminUserRequestDto._({this.reason}) : super._();
  @override
  BanAdminUserRequestDto rebuild(
          void Function(BanAdminUserRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  BanAdminUserRequestDtoBuilder toBuilder() =>
      BanAdminUserRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is BanAdminUserRequestDto && reason == other.reason;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, reason.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'BanAdminUserRequestDto')
          ..add('reason', reason))
        .toString();
  }
}

class BanAdminUserRequestDtoBuilder
    implements Builder<BanAdminUserRequestDto, BanAdminUserRequestDtoBuilder> {
  _$BanAdminUserRequestDto? _$v;

  String? _reason;
  String? get reason => _$this._reason;
  set reason(String? reason) => _$this._reason = reason;

  BanAdminUserRequestDtoBuilder() {
    BanAdminUserRequestDto._defaults(this);
  }

  BanAdminUserRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _reason = $v.reason;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(BanAdminUserRequestDto other) {
    _$v = other as _$BanAdminUserRequestDto;
  }

  @override
  void update(void Function(BanAdminUserRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  BanAdminUserRequestDto build() => _build();

  _$BanAdminUserRequestDto _build() {
    final _$result = _$v ??
        _$BanAdminUserRequestDto._(
          reason: reason,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
