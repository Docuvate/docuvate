//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ban_admin_user_request_dto.g.dart';

/// BanAdminUserRequestDto
///
/// Properties:
/// * [reason] 
@BuiltValue()
abstract class BanAdminUserRequestDto implements Built<BanAdminUserRequestDto, BanAdminUserRequestDtoBuilder> {
  @BuiltValueField(wireName: r'reason')
  String? get reason;

  BanAdminUserRequestDto._();

  factory BanAdminUserRequestDto([void updates(BanAdminUserRequestDtoBuilder b)]) = _$BanAdminUserRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BanAdminUserRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BanAdminUserRequestDto> get serializer => _$BanAdminUserRequestDtoSerializer();
}

class _$BanAdminUserRequestDtoSerializer implements PrimitiveSerializer<BanAdminUserRequestDto> {
  @override
  final Iterable<Type> types = const [BanAdminUserRequestDto, _$BanAdminUserRequestDto];

  @override
  final String wireName = r'BanAdminUserRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BanAdminUserRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.reason != null) {
      yield r'reason';
      yield serializers.serialize(
        object.reason,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    BanAdminUserRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BanAdminUserRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'reason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BanAdminUserRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BanAdminUserRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

