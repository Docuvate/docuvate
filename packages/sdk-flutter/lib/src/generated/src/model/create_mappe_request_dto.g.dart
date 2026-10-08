// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_mappe_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateMappeRequestDto extends CreateMappeRequestDto {
  @override
  final String name;
  @override
  final String? color;

  factory _$CreateMappeRequestDto(
          [void Function(CreateMappeRequestDtoBuilder)? updates]) =>
      (new CreateMappeRequestDtoBuilder()..update(updates))._build();

  _$CreateMappeRequestDto._({required this.name, this.color}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        name, r'CreateMappeRequestDto', 'name');
  }

  @override
  CreateMappeRequestDto rebuild(
          void Function(CreateMappeRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateMappeRequestDtoBuilder toBuilder() =>
      new CreateMappeRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateMappeRequestDto &&
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
    return (newBuiltValueToStringHelper(r'CreateMappeRequestDto')
          ..add('name', name)
          ..add('color', color))
        .toString();
  }
}

class CreateMappeRequestDtoBuilder
    implements Builder<CreateMappeRequestDto, CreateMappeRequestDtoBuilder> {
  _$CreateMappeRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _color;
  String? get color => _$this._color;
  set color(String? color) => _$this._color = color;

  CreateMappeRequestDtoBuilder() {
    CreateMappeRequestDto._defaults(this);
  }

  CreateMappeRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _color = $v.color;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateMappeRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateMappeRequestDto;
  }

  @override
  void update(void Function(CreateMappeRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateMappeRequestDto build() => _build();

  _$CreateMappeRequestDto _build() {
    final _$result = _$v ??
        new _$CreateMappeRequestDto._(
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'CreateMappeRequestDto', 'name'),
            color: color);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
