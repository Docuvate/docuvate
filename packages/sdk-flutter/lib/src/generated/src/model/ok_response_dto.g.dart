// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ok_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$OkResponseDto extends OkResponseDto {
  @override
  final bool ok;

  factory _$OkResponseDto([void Function(OkResponseDtoBuilder)? updates]) =>
      (OkResponseDtoBuilder()..update(updates))._build();

  _$OkResponseDto._({required this.ok}) : super._();
  @override
  OkResponseDto rebuild(void Function(OkResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  OkResponseDtoBuilder toBuilder() => OkResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is OkResponseDto && ok == other.ok;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, ok.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'OkResponseDto')..add('ok', ok))
        .toString();
  }
}

class OkResponseDtoBuilder
    implements Builder<OkResponseDto, OkResponseDtoBuilder> {
  _$OkResponseDto? _$v;

  bool? _ok;
  bool? get ok => _$this._ok;
  set ok(bool? ok) => _$this._ok = ok;

  OkResponseDtoBuilder() {
    OkResponseDto._defaults(this);
  }

  OkResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _ok = $v.ok;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(OkResponseDto other) {
    _$v = other as _$OkResponseDto;
  }

  @override
  void update(void Function(OkResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  OkResponseDto build() => _build();

  _$OkResponseDto _build() {
    final _$result = _$v ??
        _$OkResponseDto._(
          ok: BuiltValueNullFieldError.checkNotNull(ok, r'OkResponseDto', 'ok'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
