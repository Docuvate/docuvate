// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_mappe_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateMappeRequestDto extends UpdateMappeRequestDto {
  @override
  final String? name;
  @override
  final String? color;

  factory _$UpdateMappeRequestDto(
          [void Function(UpdateMappeRequestDtoBuilder)? updates]) =>
      (UpdateMappeRequestDtoBuilder()..update(updates))._build();

  _$UpdateMappeRequestDto._({this.name, this.color}) : super._();
  @override
  UpdateMappeRequestDto rebuild(
          void Function(UpdateMappeRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateMappeRequestDtoBuilder toBuilder() =>
      UpdateMappeRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateMappeRequestDto &&
        name == other.name &&
        color == other.color;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, color.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateMappeRequestDto')
          ..add('name', name)
          ..add('color', color))
        .toString();
  }
}

class UpdateMappeRequestDtoBuilder
    implements Builder<UpdateMappeRequestDto, UpdateMappeRequestDtoBuilder> {
  _$UpdateMappeRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  UpdateMappeRequestDtoBuilder() {
    UpdateMappeRequestDto._defaults(this);
  }

  UpdateMappeRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _color = $v.color;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateMappeRequestDto other) {
    _$v = other as _$UpdateMappeRequestDto;
  }

  @override
  void update(void Function(UpdateMappeRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateMappeRequestDto build() => _build();

  _$UpdateMappeRequestDto _build() {
    final _$result = _$v ??
        _$UpdateMappeRequestDto._(
          name: name,
          color: color,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
